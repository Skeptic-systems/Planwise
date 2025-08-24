import { useState, useEffect, useRef } from "react";
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
} from "@/components/ui/overlays/dialog";
import { Input } from "@/components/ui/elements/input";
import { Button } from "@/components/ui/elements/button";
import type { SchedulerPlan } from "@/components/types/types";
import { useAccessibility } from './hooks/useAccessibility';
import { useErrorHandling } from './hooks/useErrorHandling';
import type { Session } from '@supabase/supabase-js';

interface EditablePlanTabProps {
    plan: SchedulerPlan;
    isActive: boolean;
    onSelect: (id: string) => void;
    updatePlanName: (planId: string, newName: string) => void;
    deletePlan: (planId: string) => void;
    session: Session | null;
}

export function EditablePlanTab({
    plan,
    isActive,
    onSelect,
    updatePlanName,
    deletePlan,
    session,
}: EditablePlanTabProps) {
    const { getPlanTabAriaLabel, getPlanTabAriaDescribedBy, getPlanTabAriaDescription } = useAccessibility({ planId: plan.id });
    const { handleError } = useErrorHandling({ planId: plan.id });

    const [open, setOpen] = useState(false);
    const [newName, setNewName] = useState(plan.name);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        try {
            await updatePlanName(plan.id, newName);
            setOpen(false);
        } catch (error) {
            handleError(error as Error, 'plan_name_update');
        }
    };

    const handleDelete = async () => {
        try {
            await deletePlan(plan.id);
        } catch (error) {
            handleError(error as Error, 'plan_delete');
        }
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div
                    onClick={() => onSelect(plan.id)}
                    className={`px-4 py-2 cursor-pointer ${isActive ? "border-b-2 border-blue-500" : ""}`}
                    aria-label={getPlanTabAriaLabel(plan)}
                >
                    {plan.name}
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => setOpen(true)}>Edit</ContextMenuItem>
                <ContextMenuItem onClick={handleDelete}>Delete</ContextMenuItem>
            </ContextMenuContent>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Plan Name</DialogTitle>
                    </DialogHeader>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} ref={inputRef} className="text-black" />
                    <div className="mt-4">
                        <Button onClick={handleSave}>Save</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </ContextMenu>
    );
}
