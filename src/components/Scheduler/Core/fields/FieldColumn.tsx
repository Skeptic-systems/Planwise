// components/Scheduler/FieldColumn.tsx
import React, { useCallback, useRef, useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { SortableAssignment } from "../SortableAssignment";
import { DroppableTimeSlot } from "../DroppableTimeSlot";
import type { EmployeeAssignment } from "@/components/types/types";
import { timeToMinutes } from "@/components/utils/timeUtils";
import type { Session } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/overlays/dialog';
import { Input } from '@/components/ui/elements/input';
import { Button } from '@/components/ui/elements/button';
import { PASTEL_COLORS } from '@/components/Hooks/useScheudler';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/elements/context-menu";

// compute overlap columns (unchanged)
function computeOverlaps(
  assignments: EmployeeAssignment[],
  timeToMinutesFn: (time: string) => number
): Record<string, { column: number; totalColumns: number }> {
  const sorted = [...assignments].sort(
    (a, b) => timeToMinutesFn(a.startTime) - timeToMinutesFn(b.startTime)
  );
  const result: Record<string, { column: number; totalColumns: number }> = {};
  let currentGroup: EmployeeAssignment[] = [];
  let lastEnd = 0;
  const flushGroup = () => {
    if (!currentGroup.length) return;
    const cols: EmployeeAssignment[][] = [];
    for (const a of currentGroup) {
      let placed = false;
      for (const col of cols) {
        const last = col[col.length - 1];
        if (timeToMinutesFn(last.endTime) <= timeToMinutesFn(a.startTime)) {
          col.push(a); placed = true; break;
        }
      }
      if (!placed) cols.push([a]);
    }
    for (let i = 0; i < cols.length; i++) {
      for (const a of cols[i]) result[a.id] = { column: i, totalColumns: cols.length };
    }
    currentGroup = []; lastEnd = 0;
  };
  for (const a of sorted) {
    const s = timeToMinutesFn(a.startTime);
    const e = timeToMinutesFn(a.endTime);
    if (s >= lastEnd) flushGroup();
    currentGroup.push(a);
    lastEnd = Math.max(lastEnd, e);
  }
  flushGroup();
  return result;
}

interface FieldColumnProps {
  field: string;
  assignments: EmployeeAssignment[];
  index: number;
  totalColumns: number;
  pixelsPerHour: number;
  minuteStep: number;
  planId: string;
  allTimeSlots: number[];
  removeAssignment: (id: string) => void;
  updateAssignment: (id: string, updatedAssignment: EmployeeAssignment) => void;
  editorMode?: "normal" | "edittime" | "delete";
  updateField: (oldField: string, newField: string) => void;
  removeField: (field: string) => void;
  session: Session | null;
}

const minutesToHHMM = (mins:number) => {
  const h = Math.floor(mins/60);
  const m = mins%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
};

export function FieldColumn({
  field,
  assignments,
  index,
  totalColumns,
  pixelsPerHour,
  minuteStep,
  planId,
  allTimeSlots,
  removeAssignment,
  updateAssignment,
  editorMode,
  updateField,
  removeField,
  session
}: FieldColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `field-${field}`,
    data: { type: "field", field, index },
  });

  const overlaps = computeOverlaps(assignments, timeToMinutes);

  // Right-click: remember click position → prefill times
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastClickMinutesRef = useRef<number>(9 * 60);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [color, setColor] = useState(PASTEL_COLORS[0]);

  const computeMinutesFromY = (clientY: number) => {
    const el = containerRef.current;
    if (!el) return 9 * 60;
    const rect = el.getBoundingClientRect();
    const y = clientY - rect.top;
    const pxPerMinute = pixelsPerHour / 60;
    let mins = Math.round(y / pxPerMinute / minuteStep) * minuteStep;
    mins = Math.max(0, Math.min(24 * 60 - 1, mins));
    return mins;
  };

  // do NOT preventDefault → lets ContextMenu open
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    if (editorMode === 'delete') return;
    lastClickMinutesRef.current = computeMinutesFromY(e.clientY);
  }, [editorMode, pixelsPerHour, minuteStep]);

  const openAddDialogAtLastClick = useCallback(() => {
    const s = lastClickMinutesRef.current;
    const e = Math.min(24*60, s + 30);
    setStartTime(minutesToHHMM(s));
    setEndTime(minutesToHHMM(e));
    setAddOpen(true);
  }, []);

  // inside FieldColumn.tsx
const handleAdd = useCallback(async () => {
  try {
    // required local state: newName, newEmail, startTime (HH:mm), endTime (HH:mm), color, planId, field
    const payload = {
      planId,
      fieldName: field,                 // wir nutzen den sichtbaren Feldnamen
      name: newName.trim() || "New",
      email: newEmail.trim() || null,
      startTime,                        // "HH:mm" -> Server setzt Tagesdatum + :00
      endTime,
      color: color || null,
      // optional: date: "2025-08-24"  // falls du ein bestimmtes Datum erzwingen willst
    };

    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const body = await res.json();
    if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);

    // UI close + optional refresh event (wie gehabt)
    setAddOpen(false);
    setNewName(""); setNewEmail("");
    window.dispatchEvent(new CustomEvent("schedule:refresh", { detail: { planId } }));
    toast({ title: "Saved", description: "Time added to database" });
  } catch (err: any) {
    console.error(err);
    toast({ title: "Save failed", description: err?.message || "Unknown error" });
  }
}, [planId, field, newName, newEmail, startTime, endTime, color]);


  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          id={field}
          className="w-40 shrink-0 relative border-l border-gray-200"
          onContextMenu={onContextMenu}
          style={{
            height: `${24 * pixelsPerHour}px`,
            backgroundImage: `
              linear-gradient(to bottom, rgba(229,231,235,0.75) 0.5px, transparent 1px),
              linear-gradient(to bottom, rgba(229,231,235,0.3) 0.5px, transparent 1px)
            `,
            backgroundSize: `100% ${pixelsPerHour}px, 100% ${pixelsPerHour/2}px`,
          }}
        >
          {/* hit area for Y-position */}
          <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" />

          {/* Drop targets */}
          <div className="absolute inset-0 z-10 pointer-events-auto">
            {allTimeSlots.map((minutes) => (
              <DroppableTimeSlot
                key={`${field}-${minutes}`}
                id={`${field}-${minutes}`}
                top={minutes * (pixelsPerHour / 60)}
                height={minuteStep * (pixelsPerHour / 60)}
                planId={planId}
                session={session}
              />
            ))}
          </div>

          {/* Assignments */}
          <div className="absolute inset-0">
            <SortableContext items={assignments.map((a) => a.id)} strategy={verticalListSortingStrategy}>
              {assignments.map((assignment) => (
                <SortableAssignment
                  key={assignment.id}
                  assignment={assignment}
                  removeAssignment={removeAssignment}
                  timeToMinutes={(time) => {
                    const [h, m] = time.split(':').map(Number);
                    return h * 60 + m;
                  }}
                  updateAssignment={updateAssignment}
                  editorMode={editorMode}
                  session={session}
                  overlap={overlaps[assignment.id]}
                />
              ))}
            </SortableContext>
          </div>
        </div>
      </ContextMenuTrigger>

      {/* Old-style menu */}
      <ContextMenuContent className="bg-gray-900 border-gray-800">
        <ContextMenuItem
          className="text-white hover:bg-gray-800 cursor-pointer"
          onSelect={(e) => { e.preventDefault(); openAddDialogAtLastClick(); }}
        >
          Add time…
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-gray-800" />
        {/* weitere Items optional */}
      </ContextMenuContent>

      {/* Add-time dialog (inputs black) */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add time in "{field}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm">Name</label>
              <Input value={newName} onChange={(e)=>setNewName(e.target.value)} className="text-black" placeholder="Task / Person" />
            </div>
            <div>
              <label className="text-sm">Email (optional)</label>
              <Input value={newEmail} onChange={(e)=>setNewEmail(e.target.value)} className="text-black" placeholder="example@mail.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Start</label>
                <Input type="time" value={startTime} onChange={(e)=>setStartTime(e.target.value)} className="text-black" />
              </div>
              <div>
                <label className="text-sm">End</label>
                <Input type="time" value={endTime} onChange={(e)=>setEndTime(e.target.value)} className="text-black" />
              </div>
            </div>
            <div>
              <label className="text-sm">Color</label>
              <div className="flex gap-2 mt-2">
                {PASTEL_COLORS.map(c => (
                  <div key={c} onClick={()=>setColor(c)} className={`w-6 h-6 rounded-full ring-2 ring-transparent cursor-pointer ${c} ${color===c?'ring-white':''}`} />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={()=>setAddOpen(false)} className="hover:bg-white hover:text-black">Cancel</Button>
              <Button onClick={handleAdd} className="bg-primary hover:bg-white hover:text-black">Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ContextMenu>
  );
}
