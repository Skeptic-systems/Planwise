import React, { createContext, useContext, useState } from 'react';
import type { EditorMode } from '@/components/Scheduler/types/editor';
import type { EmployeeAssignment } from '@/components/Scheduler/types';

interface SchedulerContextType {
    editorMode: EditorMode;
    setEditorMode: (mode: EditorMode) => void;
    activeId: string | null;
    setActiveId: (id: string | null) => void;
    isSaving: boolean;
    setIsSaving: (saving: boolean) => void;
    selectedAssignment: EmployeeAssignment | null;
    setSelectedAssignment: (assignment: EmployeeAssignment | null) => void;
}

const SchedulerContext = createContext<SchedulerContextType | undefined>(undefined);

export function SchedulerProvider({ children }: { children: React.ReactNode }) {
    const [editorMode, setEditorMode] = useState<EditorMode>("normal");
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<EmployeeAssignment | null>(null);

    return (
        <SchedulerContext.Provider
            value={{
                editorMode,
                setEditorMode,
                activeId,
                setActiveId,
                isSaving,
                setIsSaving,
                selectedAssignment,
                setSelectedAssignment,
            }}
        >
            {children}
        </SchedulerContext.Provider>
    );
}

export function useScheduler() {
    const context = useContext(SchedulerContext);
    if (context === undefined) {
        throw new Error('useScheduler must be used within a SchedulerProvider');
    }
    return context;
} 