import { useEffect, useCallback, useRef } from 'react';
import { usePlanData } from './usePlanData';
import { useScheduler } from '../context/SchedulerContext';
import { SCHEDULER_CONSTANTS } from '../constants';

const STORAGE_KEY = 'scheduler_state';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

interface PersistedState {
    plans: any[];
    lastSaved: string;
}

export function useStatePersistence({ planId }: { planId: string }) {
    const { plans, saveAssignments } = usePlanData({ planId });
    const { editorMode } = useScheduler();
    const autoSaveInterval = useRef<NodeJS.Timeout | undefined>(undefined);

    const saveToLocalStorage = useCallback(() => {
        const state: PersistedState = {
            plans,
            lastSaved: new Date().toISOString(),
        };
        localStorage.setItem(`${STORAGE_KEY}_${planId}`, JSON.stringify(state));
    }, [plans, planId]);

    const loadFromLocalStorage = useCallback(() => {
        const savedState = localStorage.getItem(`${STORAGE_KEY}_${planId}`);
        if (savedState) {
            try {
                const state: PersistedState = JSON.parse(savedState);
                return state;
            } catch (error) {
                console.error('Error loading saved state:', error);
            }
        }
        return null;
    }, [planId]);

    const clearLocalStorage = useCallback(() => {
        localStorage.removeItem(`${STORAGE_KEY}_${planId}`);
    }, [planId]);

    // Auto-save functionality
    useEffect(() => {
        if (editorMode === 'edittime') {
            autoSaveInterval.current = setInterval(() => {
                saveToLocalStorage();
            }, AUTO_SAVE_INTERVAL);
        }

        return () => {
            if (autoSaveInterval.current) {
                clearInterval(autoSaveInterval.current);
            }
        };
    }, [editorMode, saveToLocalStorage]);

    // Save to localStorage before unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (editorMode === 'edittime') {
                saveToLocalStorage();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [editorMode, saveToLocalStorage]);

    return {
        saveToLocalStorage,
        loadFromLocalStorage,
        clearLocalStorage,
    };
} 