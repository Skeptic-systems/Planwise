export type EditorMode = "normal" | "edittime" | "delete";

export interface EditableFieldNameProps {
    field: string;
    onUpdate?: (newName: string) => void;
}

export interface EditablePlanTabProps {
    plan: {
        id: string;
        title: string;
    };
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onNameUpdate: (newName: string) => void;
} 