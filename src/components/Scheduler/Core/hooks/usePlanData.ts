import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import type { SchedulerPlan, EmployeeAssignment } from '@/components/Scheduler/types';
import { SCHEDULER_CONSTANTS } from '../constants';

interface UsePlanDataProps {
    planId: string;
}

export function usePlanData({ planId }: UsePlanDataProps) {
    const [plans, setPlans] = useState<SchedulerPlan[]>([]);
    const [fields, setFields] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    
    useEffect(() => {
        const fetchPlanData = async () => {
            try {
                setIsLoading(true);
                const { data: tabsData, error: tabsError } = await supabase
                    .from('plan_tabs')
                    .select('*')
                    .eq('plan_id', planId)
                    .order('position');

                if (tabsError) throw tabsError;
                const { data: fieldsData, error: fieldsError } = await supabase
                    .from('fields')
                    .select('*')
                    .eq('plan_id', planId);

                if (fieldsError) throw fieldsError;
                const { data: assignmentsData, error: assignmentsError } = await supabase
                    .from('assignments')
                    .select(`
                        *,
                        fields:field_id (
                            name,
                            plan_tab_id
                        )
                    `)
                    .eq('plan_id', planId);

                if (assignmentsError) throw assignmentsError;

        const transformedAssignments: EmployeeAssignment[] = (assignmentsData ?? []).map((assignment: any) => ({
            id: assignment.id,
            name: assignment.name,
            field: assignment?.fields?.name ?? '',
            fieldId: assignment.field_id,
            tabId: assignment?.fields?.plan_tab_id ?? null, 
            startTime: new Date(assignment.start_time).toLocaleTimeString('en-US', SCHEDULER_CONSTANTS.TIME_FORMAT.HOURS),
            endTime: new Date(assignment.end_time).toLocaleTimeString('en-US', SCHEDULER_CONSTANTS.TIME_FORMAT.HOURS),
            color: assignment.color,
            email: assignment.email,
        }));

        const plansData = tabsData.map((tab: any) => ({
            id: tab.id,
            title: tab.name,
            fields: fieldsData.filter((field: any) => field.plan_tab_id === tab.id),
            assignments: transformedAssignments.filter(a => a.tabId === tab.id),
        }));

                setPlans(plansData);
                setFields(fieldsData.map(field => field.name));
            } catch (error) {
                console.error('Error fetching plan data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load plan data",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlanData();
    }, [planId]);

    const addPlan = async (planName: string) => {
        try {
            const { data, error } = await supabase
                .from('plan_tabs')
                .insert([
                    {
                        name: planName,
                        plan_id: planId,
                        position: plans.length
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            setPlans(prev => [...prev, {
                id: data.id,
                title: data.name,
                fields: [],
                assignments: []
            }]);
        } catch (error) {
            console.error('Error adding plan:', error);
            toast({
                title: "Error",
                description: "Failed to add plan",
                variant: "destructive",
            });
        }
    };

    const deletePlan = async (planId: string) => {
        try {
            const { error } = await supabase
                .from('plan_tabs')
                .delete()
                .eq('id', planId);

            if (error) throw error;

            setPlans(prev => prev.filter(p => p.id !== planId));
        } catch (error) {
            console.error('Error deleting plan:', error);
            toast({
                title: "Error",
                description: "Failed to delete plan",
                variant: "destructive",
            });
        }
    };

    const updatePlanName = async (planId: string, newName: string) => {
        try {
            const { error } = await supabase
                .from('plan_tabs')
                .update({ name: newName })
                .eq('id', planId);

            if (error) throw error;

            setPlans(prev => prev.map(p => 
                p.id === planId ? { ...p, title: newName } : p
            ));
        } catch (error) {
            console.error('Error updating plan name:', error);
            toast({
                title: "Error",
                description: "Failed to update plan name",
                variant: "destructive",
            });
        }
    };

    const saveAssignments = async () => {
        try {
            const { error: assignmentsError } = await supabase
                .from('assignments')
                .upsert(
                    plans.flatMap(plan =>
                        plan.assignments.map(assignment => ({
                            id: assignment.id,
                            name: assignment.name,
                            start_time: new Date(`1970-01-01T${assignment.startTime}`).toISOString(),
                            end_time: new Date(`1970-01-01T${assignment.endTime}`).toISOString(),
                            color: assignment.color,
                            email: assignment.email,
                            field_id: plan.fields.find(field => field.name === assignment.field)?.id,
                            plan_id: plan.id
                        }))
                    )
                );

            if (assignmentsError) throw assignmentsError;

            toast({
                title: "Success",
                description: "Changes saved successfully",
            });
        } catch (error) {
            console.error('Error saving changes:', error);
            toast({
                title: "Error",
                description: "Failed to save changes",
                variant: "destructive",
            });
        }
    };

    return {
        plans,
        fields,
        isLoading,
        addPlan,
        deletePlan,
        updatePlanName,
        saveAssignments,
    };
} 