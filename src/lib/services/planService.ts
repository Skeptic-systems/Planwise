import { supabase } from '@/lib/supabase';
import type { EmployeeAssignment } from '@/components/types/types';
import type { TimeSlot, PlanSettings } from '@/components/Scheduler/Interfaces/types';

export interface PlanUpdate {
    title?: string;
    description?: string;
    is_team_plan?: boolean;
    content?: {
        fields: string[];
    };
}

export async function updatePlan(planId: string, updates: PlanUpdate) {
    const { data, error } = await supabase
        .from('plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updatePlanFields(planId: string, fields: string[]) {
    const { data, error } = await supabase
        .from('plans')
        .update({
            content: { fields }
        })
        .eq('id', planId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function saveAssignments(planId: string, assignments: EmployeeAssignment[]) {
    // First delete existing assignments for this plan
    const { error: deleteError } = await supabase
        .from('assignments')
        .delete()
        .eq('plan_id', planId);

    if (deleteError) throw deleteError;

    if (assignments.length === 0) return [];

    // Then insert the new assignments
    const { data, error } = await supabase
        .from('assignments')
        .insert(assignments.map(assignment => ({
            plan_id: planId,
            name: assignment.name,
            field: assignment.field,
            start_time: assignment.startTime,
            end_time: assignment.endTime,
            color: assignment.color,
            email: assignment.email
        })))
        .select();

    if (error) throw error;
    return data;
}

export async function saveTimeSlots(planId: string, timeSlots: TimeSlot[]) {
    // First delete existing time slots for this plan
    const { error: deleteError } = await supabase
        .from('time_slots')
        .delete()
        .eq('plan_id', planId);

    if (deleteError) throw deleteError;

    if (timeSlots.length === 0) return [];

    // Then insert the new time slots
    const { data, error } = await supabase
        .from('time_slots')
        .insert(timeSlots.map(slot => ({
            plan_id: planId,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available
        })))
        .select();

    if (error) throw error;
    return data;
}

export async function updatePlanMembers(planId: string, members: { userId: string; role: string }[]) {
    // First delete existing members
    const { error: deleteError } = await supabase
        .from('plan_members')
        .delete()
        .eq('plan_id', planId);

    if (deleteError) throw deleteError;

    if (members.length === 0) return [];

    // Then insert the new members
    const { data, error } = await supabase
        .from('plan_members')
        .insert(members.map(member => ({
            plan_id: planId,
            user_id: member.userId,
            role: member.role
        })))
        .select();

    if (error) throw error;
    return data;
}

export async function updatePlanSettings(planId: string, settings: Partial<PlanSettings>) {
    const { data, error } = await supabase
        .from('plan_settings')
        .upsert({
            plan_id: planId,
            ...settings
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function fetchPlanData(planId: string) {
    const [planResult, assignmentsResult, timeSlotsResult, membersResult, settingsResult] = await Promise.all([
        supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single(),
        supabase
            .from('assignments')
            .select('*')
            .eq('plan_id', planId),
        supabase
            .from('time_slots')
            .select('*')
            .eq('plan_id', planId),
        supabase
            .from('plan_members')
            .select(`
                *,
                profiles:user_id (
                    email,
                    name
                )
            `)
            .eq('plan_id', planId),
        supabase
            .from('plan_settings')
            .select('*')
            .eq('plan_id', planId)
            .single()
    ]);

    if (planResult.error) throw planResult.error;
    if (assignmentsResult.error) throw assignmentsResult.error;
    if (timeSlotsResult.error) throw timeSlotsResult.error;
    if (membersResult.error) throw membersResult.error;
    // Settings might not exist yet, so we don't throw on error

    return {
        plan: planResult.data,
        assignments: assignmentsResult.data || [],
        timeSlots: timeSlotsResult.data || [],
        members: membersResult.data || [],
        settings: settingsResult.data
    };
} 