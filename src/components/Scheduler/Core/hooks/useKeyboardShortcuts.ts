import { useEffect, useCallback } from 'react';
import { useScheduler } from '../context/SchedulerContext';
import { useAssignmentManagement } from './useAssignmentManagement';
import { useUndoRedo } from './useUndoRedo';
import { SCHEDULER_CONSTANTS } from '../constants';
import type { EditorMode } from '@/components/Scheduler/types/editor';
import type { Session } from '@supabase/supabase-js';
import { useAccessibility } from './useAccessibility';
import { useErrorHandling } from './useErrorHandling';
import { usePerformance } from './usePerformance';

interface ShortcutHandler {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    description: string;
    handler: () => void;
}

interface UseKeyboardShortcutsOptions {
    planId: string;
    session: Session | null;
    onSave?: () => void;
    onDelete?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
}

export function useKeyboardShortcuts({
    planId,
    session,
    onSave,
    onDelete,
    onUndo,
    onRedo,
}: UseKeyboardShortcutsOptions) {
    const { editorMode, setEditorMode, selectedAssignment, setSelectedAssignment } = useScheduler();
    const { updateAssignment, deleteAssignment } = useAssignmentManagement({ planId });
    const { undo, redo } = useUndoRedo({ planId });
    const { getKeyboardShortcutsAriaLabel, getKeyboardShortcutsAriaDescribedBy, getKeyboardShortcutsAriaDescription } = useAccessibility({ planId: planId });
    const { handleError } = useErrorHandling({ planId: planId });
    const { measurePerformance } = usePerformance();

    const shortcuts: ShortcutHandler[] = [
        {
            key: 'e',
            ctrlKey: true,
            description: 'Toggle edit mode',
            handler: () => {
                setEditorMode(editorMode === 'edittime' ? 'normal' : 'edittime');
            },
        },
        {
            key: 'z',
            ctrlKey: true,
            description: 'Undo',
            handler: () => {
                undo();
            },
        },
        {
            key: 'z',
            ctrlKey: true,
            shiftKey: true,
            description: 'Redo',
            handler: () => {
                redo();
            },
        },
        {
            key: 'Delete',
            description: 'Delete selected assignment',
            handler: () => {
                if (selectedAssignment) {
                    deleteAssignment(selectedAssignment.id);
                    setSelectedAssignment(null);
                }
            },
        },
        {
            key: 'ArrowUp',
            description: 'Move assignment up',
            handler: () => {
                if (selectedAssignment) {
                    const currentStart = new Date(`1970-01-01T${selectedAssignment.startTime}`);
                    const newStart = new Date(currentStart.getTime() - SCHEDULER_CONSTANTS.TIME.MINUTE_STEP * 60000);
                    const newStartTime = newStart.toLocaleTimeString('en-US', SCHEDULER_CONSTANTS.TIME_FORMAT.HOURS);
                    
                    const updatedAssignment = updateAssignment(selectedAssignment, {
                        startTime: newStartTime,
                    });
                    if (updatedAssignment) {
                        setSelectedAssignment(updatedAssignment);
                    }
                }
            },
        },
        {
            key: 'ArrowDown',
            description: 'Move assignment down',
            handler: () => {
                if (selectedAssignment) {
                    const currentStart = new Date(`1970-01-01T${selectedAssignment.startTime}`);
                    const newStart = new Date(currentStart.getTime() + SCHEDULER_CONSTANTS.TIME.MINUTE_STEP * 60000);
                    const newStartTime = newStart.toLocaleTimeString('en-US', SCHEDULER_CONSTANTS.TIME_FORMAT.HOURS);
                    
                    const updatedAssignment = updateAssignment(selectedAssignment, {
                        startTime: newStartTime,
                    });
                    if (updatedAssignment) {
                        setSelectedAssignment(updatedAssignment);
                    }
                }
            },
        },
        {
            key: 'Escape',
            description: 'Deselect assignment',
            handler: () => {
                if (selectedAssignment) {
                    setSelectedAssignment(null);
                }
            },
        },
    ];

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (editorMode !== 'edittime') return;

        const matchingShortcut = shortcuts.find(shortcut => {
            return (
                shortcut.key === event.key &&
                !!shortcut.ctrlKey === event.ctrlKey &&
                !!shortcut.shiftKey === event.shiftKey &&
                !!shortcut.altKey === event.altKey &&
                !!shortcut.metaKey === event.metaKey
            );
        });

        if (matchingShortcut) {
            event.preventDefault();
            matchingShortcut.handler();
        }
    }, [editorMode, shortcuts]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return {
        shortcuts,
    };
} 