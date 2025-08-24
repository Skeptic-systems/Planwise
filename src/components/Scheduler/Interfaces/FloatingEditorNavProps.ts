import type { EmployeeAssignment, SchedulerPlan } from "@/components/types/types";
import type { EditorMode } from "../Layout/FloatingEditorNav";

export interface FloatingEditorNavProps {
    mode: EditorMode;
    onModeChange: (mode: EditorMode) => void;
    assignments: EmployeeAssignment[];
    onSendEmails: () => void;
    addAssignment: (assignment: EmployeeAssignment) => Promise<void>;
    addField: (field: string) => void;
    fields: string[];
    activePlan: SchedulerPlan;
    setActivePlan: (plan: SchedulerPlan) => void;
} 