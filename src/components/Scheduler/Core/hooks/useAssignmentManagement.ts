import { useCallback, useMemo } from 'react';
import { usePlanData } from './usePlanData';
import { useScheduler } from '../context/SchedulerContext';
import { SCHEDULER_CONSTANTS } from '../constants';
import type { EmployeeAssignment } from '@/components/Scheduler/types';
import { timeToMinutes, minutesToTime } from '../utils/time';
import { useAccessibility } from './useAccessibility';
import { useErrorHandling } from './useErrorHandling';
import { usePerformance } from './usePerformance';

export function useAssignmentManagement({ planId }: { planId: string }) {
    const { plans, saveAssignments } = usePlanData({ planId });
    const { setSelectedAssignment } = useScheduler();
    const { getAssignmentAriaLabel, getAssignmentAriaDescribedBy, getAssignmentAriaDescription } = useAccessibility({ planId: plan.id });
    const { handleError } = useErrorHandling({ planId: plan.id });
    const { measurePerformance } = usePerformance();

    const validateTime = useCallback((startTime: string, endTime: string): boolean => {
        const start = timeToMinutes(startTime);
        const end = timeToMinutes(endTime);
        return start < end;
    }, []);

    const checkOverlap = useCallback((assignment: EmployeeAssignment, field: string): boolean => {
        const currentAssignments = plans
            .find(p => p.id === planId)
            ?.assignments.filter(a => a.field === field && a.id !== assignment.id) || [];

        return currentAssignments.some(existing => {
            const newStart = timeToMinutes(assignment.startTime);
            const newEnd = timeToMinutes(assignment.endTime);
            const existingStart = timeToMinutes(existing.startTime);
            const existingEnd = timeToMinutes(existing.endTime);

            return (newStart >= existingStart && newStart < existingEnd) ||
                   (newEnd > existingStart && newEnd <= existingEnd) ||
                   (newStart <= existingStart && newEnd >= existingEnd);
        });
    }, [plans, planId]);

    const createAssignment = useCallback((field: string, startTime: string, endTime: string): EmployeeAssignment | null => {
        if (!validateTime(startTime, endTime)) {
            return null;
        }

        if (checkOverlap({ id: '', name: '', field, startTime, endTime, color: '', email: '' }, field)) {
            return null;
        }

        const newAssignment: EmployeeAssignment = {
            id: `temp-${Date.now()}`,
            name: '',
            field,
            startTime,
            endTime,
            color: SCHEDULER_CONSTANTS.COLORS.BACKGROUND.WHITE,
            email: '',
        };

        return newAssignment;
    }, [validateTime, checkOverlap]);

    const updateAssignment = useCallback((assignment: EmployeeAssignment, updates: Partial<EmployeeAssignment>) => {
        const updatedAssignment = { ...assignment, ...updates };
        
        if (updates.startTime || updates.endTime) {
            if (!validateTime(updatedAssignment.startTime, updatedAssignment.endTime)) {
                return null;
            }

            if (checkOverlap(updatedAssignment, updatedAssignment.field)) {
                return null;
            }
        }

        return updatedAssignment;
    }, [validateTime, checkOverlap]);

    const deleteAssignment = useCallback((assignmentId: string) => {
        // Implementation for deleting assignment
    }, []);

    const getAssignmentColor = useCallback((assignment: EmployeeAssignment): string => {
        return assignment.color || SCHEDULER_CONSTANTS.COLORS.BACKGROUND.WHITE;
    }, []);

    return {
        validateTime,
        checkOverlap,
        createAssignment,
        updateAssignment,
        deleteAssignment,
        getAssignmentColor,
        saveAssignments,
    };
} 