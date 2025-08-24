import { useCallback, useState } from 'react';
import { useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SCHEDULER_CONSTANTS } from '../constants';
import { useScheduler } from '../context/SchedulerContext';
import type { EmployeeAssignment } from '@/components/Scheduler/types';

interface DragOverlayState {
    assignment: EmployeeAssignment | null;
    position: { x: number; y: number } | null;
}

export function useDragAndDrop() {
    const { setActiveId, setSelectedAssignment } = useScheduler();
    const [dragOverlay, setDragOverlay] = useState<DragOverlayState>({
        assignment: null,
        position: null,
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: SCHEDULER_CONSTANTS.DRAG_AND_DROP.ACTIVATION_DISTANCE,
            },
        })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(String(event.active.id));
        // Additional drag start logic can be added here
    }, [setActiveId]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveId(null);
        setDragOverlay({ assignment: null, position: null });
        // Additional drag end logic can be added here
    }, [setActiveId]);

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
        setDragOverlay({ assignment: null, position: null });
    }, [setActiveId]);

    const updateDragOverlay = useCallback((assignment: EmployeeAssignment | null, position: { x: number; y: number } | null) => {
        setDragOverlay({ assignment, position });
    }, []);

    return {
        sensors,
        dragOverlay,
        handleDragStart,
        handleDragEnd,
        handleDragCancel,
        updateDragOverlay,
    };
} 