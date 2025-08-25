import React, { useState, useCallback, useEffect, useRef } from "react";
import {
    DndContext,
    closestCenter,
    useSensors,
    useSensor,
    PointerSensor,
    DragOverlay,
    MeasuringStrategy,
} from "@dnd-kit/core";
import { type Session } from '@supabase/supabase-js';
import { FieldColumn } from "./fields/FieldColumn";
import { timeToMinutes, minutesToTime } from "@/lib/utils";
import { ScheduleTabs } from "./ScheduleTabs";
import { EditableFieldName } from "./fields/EditableFieldName";
import type { EmployeeAssignment, SchedulerPlan } from "@/components/types/types";
import { FloatingEditorNav } from "@/components/Scheduler/Layout/FloatingEditorNav";
import type { EditorMode } from "@/components/Scheduler/Layout/FloatingEditorNav";
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useAccessibility } from './hooks/useAccessibility';
import { useErrorHandling } from './hooks/useErrorHandling';
import { usePerformance } from './hooks/usePerformance';
import { ArrowLeft } from "lucide-react";


interface ScheduleBoardProps {
    plan: {
        id: string;
        title: string;
        description: string;
        user_id: string;
        created_at: string;
        is_team_plan: boolean;
    };
    session: Session;
}

const PIXELS_PER_HOUR = 64;
const MINUTE_STEP = 15;
function toLocalHHmm(v: unknown): string {
  if (v instanceof Date && !isNaN(v.getTime())) {
    const hh = String(v.getHours()).padStart(2, "0");
    const mm = String(v.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  const s = String(v ?? "");
  if (/[TzZ]/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
  }
  const m = s.replace("T", " ").match(/(?:\s)(\d{2}):(\d{2})/);
  if (m) return `${m[1]}:${m[2]}`;
  return "";
}

export function ScheduleBoard({ plan, session }: ScheduleBoardProps) {
    const { getBoardAriaLabel, getBoardAriaDescribedBy, getBoardAriaDescription } = useAccessibility({ planId: plan.id });
    const { handleError } = useErrorHandling({ planId: plan.id });
    const { measurePerformance } = usePerformance();

    const [plans, setPlans] = useState<SchedulerPlan[]>([]);
    const [activePlanId, setActivePlanId] = useState<string>(plan.id);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [editorMode, setEditorMode] = useState<EditorMode>("normal");
    const [isSaving, setIsSaving] = useState(false);
    const [fields, setFields] = useState<string[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<EmployeeAssignment | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const refreshActivePlanAssignments = useCallback(async () => {
  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from('assignments')
    .select(`*, fields:field_id ( name, plan_tab_id )`)
    .eq('plan_id', plan.id);

  if (assignmentsError) throw assignmentsError;

  const updated = (assignmentsData ?? [])
    .filter(a => a.fields?.plan_tab_id === activePlanId)
    .map(a => ({
      id: a.id,
      name: a.name,
      field: a.fields.name,
      startTime: toLocalHHmm(a.start_time),
      endTime: toLocalHHmm(a.end_time),
      color: a.color,
      email: a.email,
      planId: plan.id,
    }));

  setPlans(prev => prev.map(p => p.id === activePlanId ? { ...p, assignments: updated } : p));
}, [activePlanId, plan.id, setPlans]);

useEffect(() => {
  const onRefresh = (e: Event) => {
    const ce = e as CustomEvent<{ planId?: string }>;
    if (!ce.detail?.planId || ce.detail.planId === plan.id) {
      void refreshActivePlanAssignments();
    }
  };

  window.addEventListener('schedule:refresh', onRefresh as EventListener);
  return () => window.removeEventListener('schedule:refresh', onRefresh as EventListener);
}, [plan.id, refreshActivePlanAssignments]);


    useEffect(() => {
        const fetchPlanData = async () => {
            const measure = measurePerformance('fetch_plan_data');
            try {
                const { data: tabsData, error: tabsError } = await supabase
                    .from('plan_tabs')
                    .select('*')
                    .eq('plan_id', plan.id)
                    .order('position');

                if (tabsError) throw tabsError;
                const { data: fieldsData, error: fieldsError } = await supabase
                    .from('fields')
                    .select('*')
                    .eq('plan_id', plan.id);

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
                    .eq('plan_id', plan.id);

                if (assignmentsError) throw assignmentsError;
                const transformedAssignments = assignmentsData?.map(assignment => {
                    const startTime = toLocalHHmm(assignment.start_time);
                    const endTime   = toLocalHHmm(assignment.end_time);

                    return {
                        id: assignment.id,
                        name: assignment.name,
                        field: assignment.fields.name,
                        startTime,
                        endTime,
                        color: assignment.color,
                        email: assignment.email,
                        planId: plan.id
                    };
                });

                const organizedPlans = tabsData?.map(tab => ({
                    id: tab.id,
                    name: tab.name,
                    fields: fieldsData
                        ?.filter(field => field.plan_tab_id === tab.id)
                        ?.map(field => field.name) || [],
                    assignments: transformedAssignments
                        ?.filter(assignment => {
                        const field = fieldsData?.find(f => f.name === assignment.field && f.plan_tab_id === tab.id);
                        return !!field;
                    }) || [],

                    type: tab.type,
                    tabId: tab.id,
                    planId: plan.id
                })) || [];

                setPlans(organizedPlans);
                if (organizedPlans.length > 0) {
                    setActivePlanId(organizedPlans[0].id);
                    const firstPlanFields = fieldsData
                        ?.filter(field => field.plan_tab_id === organizedPlans[0].id)
                        ?.map(field => field.name) || [];
                    setFields(firstPlanFields);
                }
            } catch (error) {
                handleError(error as Error, 'plan_data_fetch');
            } finally {
                measure();
            }
        };

        fetchPlanData();
    }, [plan.id]);

    const activePlan = plans.find((p) => p.id === activePlanId);

    useEffect(() => {
        const ap = plans.find(p => p.id === activePlanId);
        setFields(ap?.fields ?? []);
    }, [activePlanId, plans]);

    const handleSave = async () => {
        if (!activePlan) return;
        
        const measure = measurePerformance('save_plan');
        try {
            setIsSaving(true);

            // Update tab name if changed
            const { error: tabError } = await supabase
                .from('plan_tabs')
                .update({ name: activePlan.name })
                .eq('id', activePlan.id);

            if (tabError) throw tabError;

            // Update fields
            // First, delete existing fields for this tab
            const { error: deleteFieldsError } = await supabase
                .from('fields')
                .delete()
                .eq('plan_id', plan.id)
                .eq('plan_tab_id', activePlan.id);

            if (deleteFieldsError) throw deleteFieldsError;

            // Then insert new fields
            const { error: insertFieldsError } = await supabase
                .from('fields')
                .insert(fields.map(field => ({
                    plan_id: plan.id,
                    plan_tab_id: activePlan.id,
                    name: field
                })));

            if (insertFieldsError) throw insertFieldsError;

            // Update assignments
            const { error: assignmentsError } = await supabase
                .from('assignments')
                .upsert(
                    activePlan.assignments.map(assignment => ({
                        ...assignment,
                        plan_id: plan.id,
                        field_id: activePlan.id
                    }))
                );

            if (assignmentsError) throw assignmentsError;

            toast({
                title: "Changes saved",
                description: "Your schedule has been updated successfully."
            });
        } catch (error) {
            handleError(error as Error, 'plan_save');
        } finally {
            setIsSaving(false);
            measure();
        }
    };

    // Add a new tab
// ANKER: ersetzt die bestehende addPlan-Funktion komplett
const addPlan = async (planName: string) => {
  const measure = measurePerformance('add_plan');
  try {
    // generate ids for MariaDB
    const genId = () => {
      if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
      const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(-4);
      return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
    };
    const newTabId = genId();

    // create tab
    const { data: tabRow, error: tabErr } = await supabase
      .from('plan_tabs')
      .insert({
        id: newTabId,
        plan_id: plan.id,
        name: planName,
        type: 'personal',
        position: plans.length
      })
      .select()
      .single();
    if (tabErr) throw tabErr;

    const tabId = tabRow?.id ?? newTabId;

    // create default field in DB so assignments can reference it
    const defaultFieldId = genId();
    const { error: fieldErr } = await supabase
      .from('fields')
      .insert({
        id: defaultFieldId,
        plan_id: plan.id,
        plan_tab_id: tabId,
        name: 'Field 1'
      });
    if (fieldErr) throw fieldErr;

    // update local state
    const newPlan: SchedulerPlan = {
      id: tabId,
      name: planName,
      fields: ['Field 1'],
      assignments: [],
      type: 'personal',
      tabId,
      planId: plan.id
    };
    setPlans(prev => [...prev, newPlan]);
    setActivePlanId(tabId);
    setFields(newPlan.fields);
  } catch (error) {
    handleError(error as Error, 'plan_add');
  } finally {
    measure();
  }
};


    // Delete a tab
    const deletePlan = async (planId: string) => {
        const measure = measurePerformance('delete_plan');
        try {
            const { error } = await supabase
                .from('plan_tabs')
                .delete()
                .eq('id', planId);

            if (error) throw error;

            setPlans(prevPlans => {
                const newPlans = prevPlans.filter(plan => plan.id !== planId);
                if (newPlans.length === 0) {
                    // If no plans left, create a default one
                    addPlan("Default Plan");
                } else if (planId === activePlanId) {
                    setActivePlanId(newPlans[0].id);
                }
                return newPlans;
            });
        } catch (error) {
            handleError(error as Error, 'plan_delete');
        } finally {
            measure();
        }
    };

    const updatePlanName = async (planId: string, newName: string) => {
        const measure = measurePerformance('update_plan_name');
        try {
            const { error } = await supabase
                .from('plan_tabs')
                .update({ name: newName })
                .eq('id', planId);

            if (error) {
                toast({
                    title: "Error",
                    description: "Failed to update tab name",
                    variant: "destructive"
                });
                return;
            }

            setPlans(prevPlans => prevPlans.map(plan =>
                plan.id === planId ? { ...plan, name: newName } : plan
            ));

            toast({
                title: "Success",
                description: "Tab name updated successfully"
            });
        } catch (error) {
            handleError(error as Error, 'plan_name_update');
        } finally {
            measure();
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 1,
                delay: 0,
                tolerance: 0
            }
        })
    );

    const handleDragStart = useCallback((event: any) => {
        const { active } = event;
        console.log('Drag started:', active.id);
        setActiveId(active.id);
    }, []);

    const handleDragEnd = useCallback(
        async (event: any) => {
            const { active, over } = event;

            if (!over || !active) {
                setActiveId(null);
                return;
            }

            const activeData = active.data.current;
            const overData = over.data.current;

            if (!activeData || !overData) {
                setActiveId(null);
                return;
            }

            // Handle time slot drops
            if (overData.type === 'timeSlot') {
                const [targetField, minutes] = overData.id.split('-');
                const assignment = activePlan?.assignments.find(a => a.id === active.id);
                
                if (!assignment) {
                    setActiveId(null);
                    return;
                }

                // Calculate new start and end times
                const startMinutes = parseInt(minutes);
                const duration = timeToMinutes(assignment.endTime) - timeToMinutes(assignment.startTime);
                const newStartTime = minutesToTime(startMinutes);
                const newEndTime = minutesToTime(startMinutes + duration);

                // Handle overnight shifts
                if (startMinutes + duration > 1440) {
                    toast({
                        title: "Error",
                        description: "Cannot schedule assignments that span multiple days",
                        variant: "destructive"
                    });
                    setActiveId(null);
                    return;
                }

                // Update local state immediately for smooth UI
// Update moved item in-place (no append)
if (activePlan) {
  setPlans(prev => prev.map(p =>
    p.id === activePlanId
      ? {
          ...p,
          assignments: p.assignments.map(a =>
            a.id === active.id
              ? { ...a, field: targetField, startTime: newStartTime, endTime: newEndTime }
              : a
          )
        }
      : p
  ));
}


                // Save to database in the background
                (async () => {
                    try {
                        // First, get the field ID
                        const { data: fieldData, error: fieldError } = await supabase
                            .from('fields')
                            .select('id')
                            .eq('plan_id', plan.id)
                            .eq('plan_tab_id', activePlan?.id)
                            .eq('name', targetField)
                            .single();

                        if (fieldError) throw fieldError;
                        if (!fieldData) throw new Error('Field not found');

                        // Convert time strings to timestamps
                        const today = new Date().toISOString().split('T')[0];
                        const formattedStartTime = newStartTime.padStart(5, '0');
                        const formattedEndTime = newEndTime.padStart(5, '0');
                        const startTimestamp = `${today}T${formattedStartTime}:00.000Z`;
                        const endTimestamp = `${today}T${formattedEndTime}:00.000Z`;

                        // Update the assignment in the database
                        const { error: updateError } = await supabase
                            .from('assignments')
                            .update({
                                field_id: fieldData.id,
                                start_time: startTimestamp,
                                end_time: endTimestamp
                            })
                            .eq('id', active.id);

                        if (updateError) throw updateError;
                    } catch (error) {
                        console.error('Error updating assignment:', error);
                        // Revert the local state on error
                        if (activePlan) {
                            setPlans(prevPlans => {
                                const newPlans = prevPlans.map(plan =>
                                    plan.id === activePlan.id ? {
                                        ...plan,
                                        assignments: plan.assignments.map((a: EmployeeAssignment) =>
                                            a.id === active.id ? {
                                                ...a,
                                                field: assignment.field,
                                                startTime: assignment.startTime,
                                                endTime: assignment.endTime
                                            } : a
                                        )
                                    } : plan
                                );
                                return newPlans;
                            });
                        }
                        toast({
                            title: "Error",
                            description: "Failed to save assignment position",
                            variant: "destructive"
                        });
                    }
                })();
            }

            setActiveId(null);
        },
        [activePlan, plan.id, setPlans, toast]
    );

    const visibleTimeSlots = Array.from({ length: 24 }, (_, i) => i * 60);
    const allTimeSlots = Array.from({ length: (24 * 60) / MINUTE_STEP }, (_, i) => i * MINUTE_STEP);

    const handleViewEmails = () => {
        if (!activePlan) return;
        const subject = encodeURIComponent("Your Work Schedule");
        const body = encodeURIComponent(
            "Hello,\n\nHere is your assigned shift schedule.\n\nBest regards,\nYour Team"
        );
        const emails = activePlan.assignments.map((a) => a.email).join(",");
        window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
    };

    const handleDeleteAssignment = async (assignmentId: string) => {
        try {
            const { error } = await supabase
                .from('assignments')
                .delete()
                .eq('id', assignmentId);

            if (error) throw error;

            if (activePlan) {
                setPlans(prevPlans => prevPlans.map(plan =>
                    plan.id === activePlan.id ? {
                        ...plan,
                        assignments: plan.assignments.filter(a => a.id !== assignmentId)
                    } : plan
                ));
            }

            toast({
                title: "Success",
                description: "Assignment deleted successfully"
            });
        } catch (error) {
            handleError(error as Error, 'assignment_delete');
            toast({
                title: "Error",
                description: "Failed to delete assignment",
                variant: "destructive"
            });
        }
    };

    const handleUpdateAssignment = async (assignmentId: string, updatedAssignment: EmployeeAssignment) => {
        try {
            // First, get the field ID
            const { data: fieldData, error: fieldError } = await supabase
                .from('fields')
                .select('id')
                .eq('name', updatedAssignment.field)
                .single();

            if (fieldError) throw fieldError;
            if (!fieldData) throw new Error('Field not found');

            // Convert time strings to timestamps
            const today = new Date().toISOString().split('T')[0];
            const formattedStartTime = updatedAssignment.startTime.padStart(5, '0');
            const formattedEndTime = updatedAssignment.endTime.padStart(5, '0');
            const startTimestamp = `${today}T${formattedStartTime}:00.000Z`;
            const endTimestamp = `${today}T${formattedEndTime}:00.000Z`;

            const { error } = await supabase
                .from('assignments')
                .update({
                    name: updatedAssignment.name,
                    field_id: fieldData.id,
                    start_time: startTimestamp,
                    end_time: endTimestamp,
                    color: updatedAssignment.color,
                    email: updatedAssignment.email
                })
                .eq('id', assignmentId);

            if (error) throw error;

            if (activePlan) {
                setPlans(prevPlans => prevPlans.map(plan =>
                    plan.id === activePlan.id ? {
                        ...plan,
                        assignments: plan.assignments.map(a =>
                            a.id === assignmentId ? updatedAssignment : a
                        )
                    } : plan
                ));
            }

            toast({
                title: "Success",
                description: "Assignment updated successfully"
            });
        } catch (error) {
            handleError(error as Error, 'assignment_update');
            toast({
                title: "Error",
                description: "Failed to update assignment",
                variant: "destructive"
            });
        }
    };

    return (
        <div 
            className="container h-full py-6"
            aria-label={getBoardAriaLabel()}
            aria-describedby={getBoardAriaDescribedBy()}
        >
            <div id={getBoardAriaDescribedBy()} className="sr-only">
                {getBoardAriaDescription()}
            </div>
            <div className="grid gap-4">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                    <div className="flex justify-between items-center">
                    <a href="/dashboard" className="p-2 hover:bg-muted rounded-md border-transparent">
                        <ArrowLeft size={20}/>
                    </a>
                    <h2 className="text-lg font-semibold mb-4">Schedule Editor</h2>
                    </div>
                    <div className="flex">
                        <div className="flex-1 relative">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                measuring={{
                                    droppable: {
                                        strategy: MeasuringStrategy.Always
                                    }
                                }}
                                modifiers={[]}
                                autoScroll={true}
                            >
                                <div className="p-4">
                                    <ScheduleTabs
                                        plans={plans}
                                        activePlanId={activePlanId}
                                        setActivePlanId={setActivePlanId}
                                        addPlan={addPlan}
                                        updatePlanName={updatePlanName}
                                        deletePlan={deletePlan}
                                        session={session}
                                    />
                                    <div ref={canvasRef} id="canvas" className="overflow-x-auto overflow-y-hidden">
                                        <div className="inline-flex">
                                            <div className="w-20 shrink-0"></div>
                                            {fields.map((field) => (
                                                <EditableFieldName
                                                    key={field}
                                                    field={field}
                                                    updateField={async (oldField, newField) => {
                                                        try {
                                                            // First update the fields in the database
                                                            const { error: deleteError } = await supabase
                                                                .from('fields')
                                                                .delete()
                                                                .eq('plan_id', plan.id)
                                                                .eq('plan_tab_id', activePlan?.id)
                                                                .eq('name', oldField);

                                                            if (deleteError) throw deleteError;

                                                            const { error: insertError } = await supabase
                                                                .from('fields')
                                                                .insert({
                                                                    plan_id: plan.id,
                                                                    plan_tab_id: activePlan?.id,
                                                                    name: newField
                                                                });

                                                            if (insertError) throw insertError;

                                                            // Update assignments that reference the old field name
                                                            const { error: updateAssignmentsError } = await supabase
                                                                .from('assignments')
                                                                .update({ field: newField })
                                                                .eq('plan_id', plan.id)
                                                                .eq('field', oldField);

                                                            if (updateAssignmentsError) throw updateAssignmentsError;

                                                            // Then update the local state
                                                            setFields(prevFields => prevFields.map(f =>
                                                                f === oldField ? newField : f
                                                            ));
                                                            if (activePlan) {
                                                                setPlans(prevPlans => prevPlans.map(plan =>
                                                                    plan.id === activePlan.id ? {
                                                                        ...plan,
                                                                        fields: fields.map(f => f === oldField ? newField : f),
                                                                        assignments: plan.assignments.map(assignment => 
                                                                            assignment.field === oldField 
                                                                                ? { ...assignment, field: newField }
                                                                                : assignment
                                                                        )
                                                                    } : plan
                                                                ));
                                                            }

                                                            toast({
                                                                title: "Success",
                                                                description: "Field name updated successfully"
                                                            });
                                                        } catch (error) {
                                                            console.error('Error updating field name:', error);
                                                            toast({
                                                                title: "Error",
                                                                description: "Failed to update field name",
                                                                variant: "destructive"
                                                            });
                                                        }
                                                    }}
                                                    removeField={async (field) => {
                                                        try {
                                                            const { error } = await supabase
                                                                .from('fields')
                                                                .delete()
                                                                .eq('plan_id', plan.id)
                                                                .eq('plan_tab_id', activePlan?.id)
                                                                .eq('name', field);

                                                            if (error) throw error;

                                                            setFields(prevFields => prevFields.filter(f => f !== field));
                                                            if (activePlan) {
                                                                setPlans(prevPlans => prevPlans.map(plan =>
                                                                    plan.id === activePlan.id ? {
                                                                        ...plan,
                                                                        fields: plan.fields.filter(f => f !== field),
                                                                        assignments: plan.assignments.filter((a: EmployeeAssignment) => a.field !== field)
                                                                    } : plan
                                                                ));
                                                            }

                                                            toast({
                                                                title: "Success",
                                                                description: "Field removed successfully"
                                                            });
                                                        } catch (error) {
                                                            console.error('Error removing field:', error);
                                                            toast({
                                                                title: "Error",
                                                                description: "Failed to remove field",
                                                                variant: "destructive"
                                                            });
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div className="relative">
                                            <div className="flex">
                                                <div className="w-20 shrink-0">
                                                    {visibleTimeSlots.map((minutes) => (
                                                        <div
                                                            key={minutes}
                                                            className="text-right pr-2 py-2 text-sm"
                                                            style={{ height: `${PIXELS_PER_HOUR}px` }}
                                                        >
                                                            {minutesToTime(minutes)}
                                                        </div>
                                                    ))}
                                                </div>
                                                {fields.map((field) => {
                                                    const fieldAssignments = activePlan?.assignments?.filter(
                                                        (a) => a.field === field
                                                    ) || [];
                                                    return (
                                                        <FieldColumn
                                                            key={field}
                                                            field={field}
                                                            assignments={fieldAssignments}
                                                            index={fields.indexOf(field)}
                                                            totalColumns={fields.length}
                                                            pixelsPerHour={PIXELS_PER_HOUR}
                                                            minuteStep={MINUTE_STEP}
                                                            planId={plan.id}
                                                            allTimeSlots={Array.from({ length: 24 * 60 / MINUTE_STEP }, (_, i) => i * MINUTE_STEP)}
                                                            removeAssignment={handleDeleteAssignment}
                                                            updateAssignment={handleUpdateAssignment}
                                                            editorMode={editorMode}
                                                            updateField={async (oldField, newField) => {
                                                                try {
                                                                    const { error: deleteError } = await supabase
                                                                        .from('fields')
                                                                        .delete()
                                                                        .eq('plan_id', plan.id)
                                                                        .eq('plan_tab_id', activePlan?.id)
                                                                        .eq('name', oldField);

                                                                    if (deleteError) throw deleteError;

                                                                    const { error: insertError } = await supabase
                                                                        .from('fields')
                                                                        .insert({
                                                                            plan_id: plan.id,
                                                                            plan_tab_id: activePlan?.id,
                                                                            name: newField
                                                                        });

                                                                    if (insertError) throw insertError;

                                                                    setFields(prevFields => prevFields.map(f =>
                                                                        f === oldField ? newField : f
                                                                    ));
                                                                } catch (error) {
                                                                    console.error('Error updating field name:', error);
                                                                }
                                                            }}
                                                            removeField={async (field) => {
                                                                try {
                                                                    const { error } = await supabase
                                                                        .from('fields')
                                                                        .delete()
                                                                        .eq('plan_id', plan.id)
                                                                        .eq('plan_tab_id', activePlan?.id)
                                                                        .eq('name', field);

                                                                    if (error) throw error;

                                                                    setFields(prevFields => prevFields.filter(f => f !== field));
                                                                } catch (error) {
                                                                    console.error('Error removing field:', error);
                                                                }
                                                            }}
                                                            session={session}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DragOverlay>
                                    {activeId && activePlan ? (
                                        <div className="w-40 bg-white border p-2 rounded shadow-lg">
                                            {activePlan.assignments.find((a) => a.id === activeId)?.name}
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                            <FloatingEditorNav
                                mode={editorMode}
                                onModeChange={setEditorMode}
                                assignments={activePlan?.assignments || []}
                                onSendEmails={handleViewEmails}
                                addAssignment={async (assignment) => {
                                    try {
                                        // First, get the field ID
                                        const { data: fieldData, error: fieldError } = await supabase
                                            .from('fields')
                                            .select('id')
                                            .eq('plan_id', plan.id)
                                            .eq('plan_tab_id', activePlan?.id)
                                            .eq('name', assignment.field)
                                            .single();

                                        if (fieldError) throw fieldError;
                                        if (!fieldData) throw new Error('Field not found');

                                        // Convert time strings to timestamps
const d=new Date();const yyyy=d.getFullYear();const mm=String(d.getMonth()+1).padStart(2,"0");const dd=String(d.getDate()).padStart(2,"0");const date=`${yyyy}-${mm}-${dd}`;
const startTimestamp = `${date} ${assignment.startTime}:00`;
const endTimestamp   = `${date} ${assignment.endTime}:00`;

                                        const { data: newAssignment, error } = await supabase
                                            .from('assignments')
                                            .insert({
                                                plan_id: plan.id,
                                                field_id: fieldData.id,
                                                name: assignment.name,
                                                start_time: startTimestamp,
                                                end_time: endTimestamp,
                                                color: assignment.color,
                                                email: assignment.email
                                            })
                                            .select()
                                            .single();

                                        if (error) throw error;

setPlans(prev => prev.map(p =>
  p.id === activePlanId
    ? {
        ...p,
        assignments: [
          ...p.assignments,
          {
            id: newAssignment.id,                  // from DB
            name: assignment.name,
            field: assignment.field,               // string field name
            startTime: assignment.startTime,       // "HH:mm"
            endTime: assignment.endTime,           // "HH:mm"
            color: assignment.color,
            email: assignment.email,
            planId: plan.id
          }
        ]
      }
    : p
));


                                        toast({
                                            title: "Success",
                                            description: "Assignment added successfully"
                                        });
                                    } catch (error) {
                                        console.error('Error adding assignment:', error);
                                        toast({
                                            title: "Error",
                                            description: "Failed to add assignment",
                                            variant: "destructive"
                                        });
                                        throw error; // Re-throw to be caught by the dialog
                                    }
                                }}
                                addField={(field) => {
                                    if (!activePlan) {
                                        toast({
                                            title: "Error",
                                            description: "No active tab selected",
                                            variant: "destructive"
                                        });
                                        return;
                                    }

                                    // Save to database immediately without updating local state first
                                    (async () => {
                                        try {
                                            const { data: insertedField, error: insertError } = await supabase
                                                .from('fields')
                                                .insert({
                                                    plan_id: plan.id,
                                                    plan_tab_id: activePlan.id,
                                                    name: field
                                                })
                                                .select()
                                                .single();

                                            if (insertError) {
                                                console.error('Field insert error:', {
                                                    error: insertError,
                                                    attemptedInsert: {
                                                        plan_id: plan.id,
                                                        plan_tab_id: activePlan.id,
                                                        name: field
                                                    }
                                                });
                                                throw insertError;
                                            }

                                            // Only update local state after successful database insertion
                                            setFields(prevFields => [...prevFields, field]);
                                            setPlans(prevPlans => prevPlans.map(plan =>
                                                plan.id === activePlan.id ? {
                                                    ...plan,
                                                    fields: [...plan.fields, field]
                                                } : plan
                                            ));

                                            toast({
                                                title: "Success",
                                                description: "Field added successfully"
                                            });
                                        } catch (error) {
                                            console.error('Error adding field:', error);
                                            toast({
                                                title: "Error",
                                                description: "Failed to add field",
                                                variant: "destructive"
                                            });
                                        }
                                    })();
                                }}
                                fields={fields}
                                activePlan={activePlan || {
                                    id: '',
                                    name: '',
                                    fields: [],
                                    assignments: [],
                                    type: 'personal',
                                    tabId: '',
                                    planId: plan.id
                                }}
                                setActivePlan={(newPlan) => {
                                    setPlans(prevPlans => prevPlans.map(plan =>
                                        plan.id === activePlan?.id ? newPlan : plan
                                    ));
                                    setActivePlanId(newPlan.id);
                                    setFields(newPlan.fields);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
