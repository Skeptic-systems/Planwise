export interface EmployeeAssignment {
    id: string;
    name: string;
    field: string;
    startTime: string;
    endTime: string;
    color: string;
    email?: string;
}

export interface SchedulerPlan {
    id: string;
    title: string;
    fields: Field[];
    assignments: EmployeeAssignment[];
}

export interface Field {
    id: string;
    name: string;
    plan_tab_id: string;
}

export interface ShiftPart {
    startMinutes: number;
    height: number;
    isOvernight: boolean;
    isFirstPart?: boolean;
    isSecondPart?: boolean;
    displayTime: string;
}

export interface AssignmentOverlap {
    column: number;
    totalColumns: number;
}

export interface ScheduleBoardProps {
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

export interface AssignmentCardProps {
    assignment: EmployeeAssignment;
    removeAssignment: (id: string) => void;
    timeToMinutes: (time: string) => number;
    overlap?: AssignmentOverlap;
    updateAssignment: (id: string, updatedAssignment: EmployeeAssignment) => void;
    restoreAssignment?: (assignment: EmployeeAssignment) => void;
    editorMode?: "normal" | "edittime" | "delete";
}

export interface FieldColumnProps {
    field: string;
    assignments: EmployeeAssignment[];
    index: number;
    totalColumns: number;
    pixelsPerHour: number;
    minuteStep: number;
}

export interface TimeGridProps {
    startHour: number;
    endHour: number;
    pixelsPerHour: number;
}

export interface PlanTabsProps {
    plans: SchedulerPlan[];
    activePlanId: string;
    onPlanSelect: (planId: string) => void;
    onPlanAdd: () => void;
    onPlanDelete: (planId: string) => void;
    onPlanNameUpdate: (planId: string, newName: string) => void;
}

export interface AssignmentContextMenuProps {
    assignment: EmployeeAssignment;
    onEdit: () => void;
    onDelete: () => void;
    children: React.ReactNode;
}

export interface AssignmentDialogProps {
    assignment: EmployeeAssignment;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedAssignment: EmployeeAssignment) => void;
    onDelete: () => void;
} 