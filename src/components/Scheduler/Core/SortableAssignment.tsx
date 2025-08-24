import { useState, useEffect } from "react";
import { Button } from "@/components/ui/elements/button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { EmployeeAssignment } from "@/components/types/types";
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useAccessibility } from "./hooks/useAccessibility";
import { useErrorHandling } from "./hooks/useErrorHandling";
import type { Session } from '@supabase/supabase-js';
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
} from "@/components/ui/navigation/context-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/overlays/dialog";
import { MoveDown } from "lucide-react";
import { PASTEL_COLORS } from "@/components/Hooks/useScheudler";

interface SortableAssignmentProps {
    assignment: EmployeeAssignment;
    removeAssignment: (id: string) => void;
    timeToMinutes: (time: string) => number;
    overlap?: {
        column: number;
        totalColumns: number;
    };
    updateAssignment: (id: string, updatedAssignment: EmployeeAssignment) => void;
    restoreAssignment?: (assignment: EmployeeAssignment) => void;
    editorMode?: "normal" | "edittime" | "delete";
    session: Session | null;
}

interface ShiftPart {
    startMinutes: number;
    height: number;
    isOvernight?: boolean;
    isFirstPart?: boolean;
    isSecondPart?: boolean;
    displayTime: string;
}

const PIXELS_PER_HOUR = 64;

function isOvernightShift(startTime: string, endTime: string): boolean {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    return endMinutes < startMinutes;
}

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function calculateShiftDisplay(startTime: string, endTime: string): ShiftPart[] {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const midnightMinutes = 24 * 60;

    // If end time is earlier than start time, it's an overnight shift
    if (endMinutes < startMinutes) {
        // Calculate the total duration considering the midnight crossing
        const firstPartDuration = midnightMinutes - startMinutes;
        const secondPartDuration = endMinutes;

        // Ensure heights are non-negative and properly calculated
        const firstPartHeight = Math.max(0, (firstPartDuration / 60)) * PIXELS_PER_HOUR;
        const secondPartHeight = Math.max(0, (secondPartDuration / 60)) * PIXELS_PER_HOUR;

        return [
            {
                startMinutes,
                height: firstPartHeight,
                isOvernight: true,
                isFirstPart: true,
                displayTime: startTime
            },
            {
                startMinutes: 0,
                height: secondPartHeight,
                isOvernight: true,
                isSecondPart: true,
                displayTime: endTime
            }
        ];
    }

    // Regular shift (not overnight)
    const duration = endMinutes - startMinutes;
    const height = Math.max(0, (duration / 60)) * PIXELS_PER_HOUR;
    
    return [{
        startMinutes,
        height,
        isOvernight: false,
        displayTime: startTime
    }];
}

function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function SortableAssignment({
    assignment,
    removeAssignment,
    timeToMinutes,
    overlap,
    updateAssignment,
    editorMode = "normal",
    session
}: SortableAssignmentProps) {
    const { getAssignmentAriaLabel, getAssignmentAriaDescribedBy, getAssignmentAriaDescription } = useAccessibility({ planId: assignment.planId });
    const { handleError } = useErrorHandling({ planId: assignment.planId });

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ 
            id: assignment.id,
            data: {
                type: 'assignment',
                assignment
            },
            disabled: editorMode !== "normal"
        });

    const style = transform ? {
        transform: CSS.Transform.toString(transform),
        transition,
    } : undefined;

    // Calculate the transformed position
    let transformedStartMinutes = timeToMinutes(assignment.startTime);
    let transformedEndMinutes = timeToMinutes(assignment.endTime);
    
    // Calculate duration consistently
    let originalDuration;
    if (transformedEndMinutes < transformedStartMinutes) {
        originalDuration = (24 * 60 - transformedStartMinutes) + transformedEndMinutes;
    } else {
        originalDuration = transformedEndMinutes - transformedStartMinutes;
        if (originalDuration < 0) {
            originalDuration += 24 * 60;
        }
    }
    
    if (transform) {
        const pixelOffset = transform.y;
        const hourOffset = pixelOffset / PIXELS_PER_HOUR;
        const minuteOffset = Math.round(hourOffset * 60);
        
        // Calculate new start time and normalize
        let newStartMinutes = (transformedStartMinutes + minuteOffset + 24 * 60) % (24 * 60);
        
        // Calculate new end time based on original duration
        let newEndMinutes = (newStartMinutes + originalDuration);
        
        // Handle overnight shifts
        if (newEndMinutes >= 24 * 60) {
            newEndMinutes = newEndMinutes % (24 * 60);
        }
        
        transformedStartMinutes = newStartMinutes;
        transformedEndMinutes = newEndMinutes;
    }

    const displayStartTime = transform ? minutesToTime(transformedStartMinutes) : assignment.startTime;
    const displayEndTime = transform ? minutesToTime(transformedEndMinutes) : assignment.endTime;

    // Calculate if it's an overnight shift
    const isOvernight = transformedEndMinutes < transformedStartMinutes;

    const shiftParts: ShiftPart[] = isOvernight ? [
        {
            startMinutes: transformedStartMinutes,
            height: ((24 * 60 - transformedStartMinutes) / 60) * PIXELS_PER_HOUR,
            isOvernight: true,
            isFirstPart: true,
            displayTime: displayStartTime
        },
        {
            startMinutes: 0,
            height: (transformedEndMinutes / 60) * PIXELS_PER_HOUR,
            isOvernight: true,
            isSecondPart: true,
            displayTime: displayEndTime
        }
    ] : [
        {
            startMinutes: transformedStartMinutes,
            height: (originalDuration / 60) * PIXELS_PER_HOUR,
            isOvernight: false,
            displayTime: displayStartTime
        }
    ];

    let width = "100%";
    let left = "0%";
    if (overlap) {
        width = `${100 / overlap.totalColumns}%`;
        left = `${(overlap.column * 100) / overlap.totalColumns}%`;
    }

    const [newStartTime, setNewStartTime] = useState(assignment.startTime);
    const [newEndTime, setNewEndTime] = useState(assignment.endTime);
    const [selectedColor, setSelectedColor] = useState(assignment.color);

    useEffect(() => {
        setNewStartTime(assignment.startTime);
        setNewEndTime(assignment.endTime);
        setSelectedColor(assignment.color);
    }, [assignment.startTime, assignment.endTime, assignment.color]);

    const [editOpen, setEditOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

// inside SortableAssignment.tsx
const handleSave = async () => {
  try {
    // 1) Normalize HH:mm
    const pad = (t: string) => (t || "").trim().padStart(5, "0"); // "8:5" -> "08:05"
    const sHHMM = pad(newStartTime);
    const eHHMM = pad(newEndTime);

    // 2) Derive base date from current row (fallback: today)
    // Supports both snake_case and camelCase from your existing model
    const currentStart = (assignment.start_time || assignment.startTime || "") as string;
    const baseDate =
      (typeof currentStart === "string" && currentStart.length >= 10 ? currentStart.slice(0, 10) : new Date().toISOString().slice(0, 10));

    // 3) Build MySQL DATETIME strings
    const toMysql = (dateStr: string, hhmm: string) => `${dateStr} ${hhmm}:00`;
    let startDT = toMysql(baseDate, sHHMM);
    let endDT = toMysql(baseDate, eHHMM);

    // Overnight handling (end < start -> end + 1 day)
    const [sh, sm] = sHHMM.split(":").map(Number);
    const [eh, em] = eHHMM.split(":").map(Number);
    if (eh < sh || (eh === sh && em < sm)) {
      const d = new Date(baseDate + "T00:00:00");
      d.setDate(d.getDate() + 1);
      const next = d.toISOString().slice(0, 10);
      endDT = toMysql(next, eHHMM);
    }

    // 4) Try PATCH /api/assignments first (if route exists)
    let patched = false;
    try {
      const res = await fetch("/api/assignments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: assignment.id,
          startTime: sHHMM,         // API expects HH:mm
          endTime: eHHMM,           // API expects HH:mm
          color: selectedColor ?? assignment.color ?? null,
          planId: assignment.plan_id || assignment.planId || undefined,
          date: baseDate,
        }),
      });
      if (res.ok) {
        // If your API returns the updated row, we could use it; not required
        patched = true;
      }
    } catch {
      // ignore and fallback
    }

    // 5) Fallback to /api/db via supabase shim (uses full DATETIME)
    if (!patched) {
      const { error } = await supabase
        .from("assignments")
        .update({
          start_time: startDT,
          end_time: endDT,
          color: selectedColor ?? assignment.color ?? null,
        })
        .eq("id", assignment.id)
        .single();
      if (error) throw new Error(error.message);
    }

    // 6) Optimistic local update for instant UI
    updateAssignment(assignment.id, {
      ...assignment,
      // Keep both shapes to satisfy consumers
      start_time: startDT,
      end_time: endDT,
      startTime: sHHMM,
      endTime: eHHMM,
      color: selectedColor ?? assignment.color ?? null,
    });

    // 7) Notify other views to refetch if needed
    window.dispatchEvent(new CustomEvent("schedule:refresh", { detail: { planId: assignment.plan_id || assignment.planId } }));

    setEditOpen(false);
    toast({ title: "Success", description: "Assignment updated" });
  } catch (error) {
    handleError(error as Error, "assignment_update");
    toast({ title: "Error", description: "Failed to update assignment", variant: "destructive" });
  }
};


    const handleDelete = async () => {
        try {
            const { error } = await supabase
                .from('assignments')
                .delete()
                .eq('id', assignment.id);

            if (error) throw error;

            removeAssignment(assignment.id);
            setDeleteConfirmOpen(false);
            toast({
                title: "Success",
                description: "Assignment deleted successfully"
            });
        } catch (error) {
            handleError(error as Error, 'assignment_delete');
        }
    };

    const handleClick = () => {
        if (editorMode === "edittime") {
            setEditOpen(true);
        } else if (editorMode === "delete") {
            setDeleteConfirmOpen(true);
        }
    };

    // Add validation for time inputs
    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStart = e.target.value;
        setNewStartTime(newStart);
        
        // If end time is before new start time, update end time
        if (newEndTime < newStart) {
            setNewEndTime(newStart);
        }
    };

    const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEnd = e.target.value;
        setNewEndTime(newEnd);
        
        // If start time is after new end time, update start time
        if (newStartTime > newEnd) {
            setNewStartTime(newEnd);
        }
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                {shiftParts.map((part, index) => (
                    <div
                        key={index}
                        ref={setNodeRef}
                        {...(editorMode === "normal" ? { ...attributes, ...listeners } : {})}
                        onClick={handleClick}
                        className={`${assignment.color} rounded p-1 text-xs overflow-hidden ${editorMode === "normal" ? "cursor-move" : "cursor-pointer"} border absolute`}
                        style={{
                            ...style,
                            top: `${(part.startMinutes / 60) * PIXELS_PER_HOUR}px`,
                            height: `${part.height}px`,
                            width,
                            left,
                            zIndex: isDragging ? 50 : 10,
                            borderLeft: `15px solid ${assignment.color}`,
                            opacity: isDragging ? 0.2 : 0.9,
                            pointerEvents: 'auto',

                            boxShadow: isDragging 
                                ? '0 12px 24px -6px rgba(0, 0, 0, 0.15), 0 6px 12px -3px rgba(0, 0, 0, 0.1)' 
                                : '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
                            transform: isDragging 
                                ? 'scale(1.02) rotate(1deg) translateY(-2px)' 
                                : 'scale(1) rotate(0deg) translateY(0)',
                            backdropFilter: isDragging ? 'blur(4px)' : 'none',
                            borderColor: isDragging ? 'rgba(255, 255, 255, 0.9)' : 'inherit',
                            backgroundColor: isDragging ? `${assignment.color}30` : assignment.color,
                            willChange: 'transform, opacity, box-shadow'
                        }}
                        aria-label={getAssignmentAriaLabel(assignment)}
                        aria-describedby={getAssignmentAriaDescribedBy(assignment)}
                    >
                        <div id={getAssignmentAriaDescribedBy(assignment)} className="sr-only">
                            {getAssignmentAriaDescription(assignment)}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-black text-md">{assignment.name}</span>
                            {isOvernight && (
                                <span className="text-xs text-gray-600">
                                    {part.isFirstPart ? '→ 00:00' : '00:00 →'}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col mt-2">
                            <span className="text-black text-md">
                                {isOvernight ? (part.isFirstPart ? displayStartTime : '00:00') : displayStartTime}
                            </span>
                            <span className="text-black text-md">
                                <MoveDown />
                            </span>
                            <span className="text-black text-md">
                                {isOvernight ? (part.isFirstPart ? '00:00' : displayEndTime) : displayEndTime}
                            </span>
                        </div>
                    </div>
                ))}
            </ContextMenuTrigger>
            {editorMode === "normal" && (
                <ContextMenuContent>
                    <ContextMenuItem onSelect={() => setEditOpen(true)}>
                        Edit
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => setDeleteConfirmOpen(true)}>
                        Delete
                    </ContextMenuItem>
                </ContextMenuContent>
            )}

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Assignment</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm">Start Time</label>
                        <input
                            type="time"
                            value={newStartTime}
                            onChange={handleStartTimeChange}
                            className="border p-1 rounded bg-secondary text-black"
                        />
                        <label className="text-sm">End Time</label>
                        <input
                            type="time"
                            value={newEndTime}
                            onChange={handleEndTimeChange}
                            className="border p-1 rounded bg-secondary text-black"
                        />
                        <div className="mt-2">
                            <label className="text-sm">Select Color</label>
                            <div className="flex space-x-2 mt-2">
                                {PASTEL_COLORS.map((color) => (
                                    <div
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-8 h-8 rounded-full cursor-pointer ${color} ${
                                            color === selectedColor ? "border-2 border-black" : ""
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                        <Button onClick={handleSave} className="hover:bg-white hover:text-black">Save</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this assignment?</p>
                    <DialogFooter>
                        <Button className="hover:bg-white hover:text-black" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="hover:bg-red-500" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ContextMenu>
    );
}