import { useEffect, useCallback } from 'react';
import { useScheduler } from '../context/SchedulerContext';
import { useAssignmentManagement } from './useAssignmentManagement';
import { SCHEDULER_CONSTANTS } from '../constants';
import { timeToMinutes, minutesToTime } from '../utils/time';

export function useKeyboardNavigation({ planId }: { planId: string }) {
    const { editorMode, selectedAssignment, setSelectedAssignment } = useScheduler();
    const { updateAssignment } = useAssignmentManagement({ planId });

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (editorMode !== 'edittime' || !selectedAssignment) return;

        const { startTime, endTime } = selectedAssignment;
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        const minuteStep = SCHEDULER_CONSTANTS.TIME.MINUTE_STEP;

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                const newStartTime = minutesToTime(startMinutes - minuteStep);
                const updatedAssignment = updateAssignment(selectedAssignment, {
                    startTime: newStartTime,
                });
                if (updatedAssignment) {
                    setSelectedAssignment(updatedAssignment);
                }
                break;

            case 'ArrowDown':
                event.preventDefault();
                const newEndTime = minutesToTime(endMinutes + minuteStep);
                const updatedEndAssignment = updateAssignment(selectedAssignment, {
                    endTime: newEndTime,
                });
                if (updatedEndAssignment) {
                    setSelectedAssignment(updatedEndAssignment);
                }
                break;

            case 'Escape':
                event.preventDefault();
                setSelectedAssignment(null);
                break;

            case 'Delete':
                event.preventDefault();
                // Implement delete functionality
                break;
        }
    }, [editorMode, selectedAssignment, updateAssignment, setSelectedAssignment]);

    useEffect(() => {
        if (editorMode === 'edittime') {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [editorMode, handleKeyDown]);

    return {
        handleKeyDown,
    };
} 