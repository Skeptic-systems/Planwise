import { useState, useCallback, useRef, useEffect } from 'react';
import { useScheduler } from '../context/SchedulerContext';
import { usePlanData } from './usePlanData';
import type { SchedulerPlan } from '@/components/Scheduler/types';

interface HistoryState {
    plans: SchedulerPlan[];
    timestamp: number;
}

export function useUndoRedo({ planId }: { planId: string }) {
    const { plans, saveAssignments } = usePlanData({ planId });
    const { editorMode } = useScheduler();
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const isUndoRedoRef = useRef(false);

    const addToHistory = useCallback((newPlans: SchedulerPlan[]) => {
        if (isUndoRedoRef.current) return;

        const newState: HistoryState = {
            plans: newPlans,
            timestamp: Date.now(),
        };

        setHistory(prev => {
            const newHistory = [...prev.slice(0, currentIndex + 1), newState];
            return newHistory;
        });
        setCurrentIndex(prev => prev + 1);
    }, [currentIndex]);

    const undo = useCallback(() => {
        if (currentIndex <= 0) return;

        isUndoRedoRef.current = true;
        setCurrentIndex(prev => prev - 1);
        isUndoRedoRef.current = false;
    }, [currentIndex]);

    const redo = useCallback(() => {
        if (currentIndex >= history.length - 1) return;

        isUndoRedoRef.current = true;
        setCurrentIndex(prev => prev + 1);
        isUndoRedoRef.current = false;
    }, [currentIndex, history.length]);

    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;

    // Add keyboard shortcuts
    useEffect(() => {
        if (editorMode !== 'edittime') return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey) {
                if (event.key === 'z') {
                    event.preventDefault();
                    if (event.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editorMode, undo, redo]);

    // Save to history when plans change
    useEffect(() => {
        if (!isUndoRedoRef.current) {
            addToHistory(plans);
        }
    }, [plans, addToHistory]);

    return {
        undo,
        redo,
        canUndo,
        canRedo,
        currentState: history[currentIndex]?.plans,
    };
} 