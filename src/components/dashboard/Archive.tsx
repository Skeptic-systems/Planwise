import React, { useEffect, useState } from 'react';
import { type Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/elements/card';
import { Button } from '@/components/ui/elements/button';
import { Undo2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ArchivedPlan {
    id: string;
    plan_id: string;
    plan_data: {
        title: string;
        description: string;
        is_team_plan: boolean;
        user_id: string;
        created_at: string;
        members?: Array<{
            plan_id: string;
            user_id: string;
            role: string;
        }>;
        tabs?: Array<{
            name: string;
            type: string;
            position: number;
            created_at: string;
        }>;
        fields?: Array<{
            name: string;
            type: string;
            position: number;
            created_at: string;
        }>;
    };
    archived_at: string;
    user_id: string;
}

interface ArchiveProps {
    session: Session;
}

export function Archive({ session }: ArchiveProps) {
    const [archivedPlans, setArchivedPlans] = useState<ArchivedPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchArchivedPlans();
    }, [session]);

    const fetchArchivedPlans = async () => {
        try {
            if (!session?.user?.id) return;

            const { data, error } = await supabase
                .from('plan_archive')
                .select(`
                    id,
                    plan_id,
                    plan_data,
                    archived_at,
                    user_id
                `)
                .eq('user_id', session.user.id)
                .order('archived_at', { ascending: false })
                .limit(5);

            if (error) {
                console.error('Supabase query error:', error);
                throw error;
            }
            
            console.log('Fetched archived plans:', data);
            setArchivedPlans(data || []);
        } catch (error: any) {
            console.error('Error fetching archived plans:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch archived plans",
                icon: <AlertCircle className="h-5 w-5 text-red-400" />,
                className: "border-red-500"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (archivedPlan: ArchivedPlan) => {
        try {
            // First, restore the plan
            const { error: planError } = await supabase
                .from('plans')
                .upsert({
                    id: archivedPlan.plan_id,
                    title: archivedPlan.plan_data.title,
                    description: archivedPlan.plan_data.description,
                    is_team_plan: archivedPlan.plan_data.is_team_plan,
                    user_id: archivedPlan.plan_data.user_id,
                    created_at: archivedPlan.plan_data.created_at
                });

            if (planError) throw planError;

            if (archivedPlan.plan_data.tabs) {
                const { error: tabsError } = await supabase
                    .from('plan_tabs')
                    .upsert(
                        archivedPlan.plan_data.tabs.map(tab => ({
                            ...tab,
                            plan_id: archivedPlan.plan_id
                        }))
                    );

                if (tabsError) throw tabsError;
            } else {
                const { error: defaultTabError } = await supabase
                    .from('plan_tabs')
                    .insert([{
                        plan_id: archivedPlan.plan_id,
                        name: 'Default Tab',
                        type: 'personal',
                        position: 0,
                        created_at: new Date().toISOString()
                    }]);

                if (defaultTabError) throw defaultTabError;
            }

            if (archivedPlan.plan_data.fields) {
                const { error: fieldsError } = await supabase
                    .from('fields')
                    .upsert(
                        archivedPlan.plan_data.fields.map(field => ({
                            ...field,
                            plan_id: archivedPlan.plan_id
                        }))
                    );

                if (fieldsError) throw fieldsError;
            }

            if (archivedPlan.plan_data.is_team_plan && archivedPlan.plan_data.members) {
                const { error: membersError } = await supabase
                    .from('plan_members')
                    .upsert(
                        archivedPlan.plan_data.members.map(member => ({
                            plan_id: member.plan_id,
                            user_id: member.user_id,
                            role: member.role
                        }))
                    );

                if (membersError) throw membersError;
            }

            const { error: deleteError } = await supabase
                .from('plan_archive')
                .delete()
                .eq('id', archivedPlan.id);

            if (deleteError) throw deleteError;

            await fetchArchivedPlans();

            toast({
                title: "Success",
                description: "Plan restored successfully",
                icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
                className: "border-emerald-500"
            });
        } catch (error: any) {
            console.error('Error restoring plan:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to restore plan",
                icon: <AlertCircle className="h-5 w-5 text-red-400" />,
                className: "border-red-500"
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-4">
                <Skeleton className="h-8 w-48 mb-4" />
                <div className="grid gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-lg border bg-card p-6">
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (archivedPlans.length === 0) {
        return (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-2">No archived plans</h3>
                <p className="text-muted-foreground">
                    When you delete plans, they will appear here for recovery.
                </p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Recently Archived Plans</h2>
            <div className="grid gap-4">
                {archivedPlans.map((plan) => (
                    <Card key={plan.id} className="w-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{plan.plan_data.title}</CardTitle>
                                    <CardDescription>
                                        {plan.plan_data.description || 'No description'}
                                        <br />
                                        Archived on: {new Date(plan.archived_at).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleRestore(plan)}
                                    title="Restore plan"
                                >
                                    <Undo2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
} 