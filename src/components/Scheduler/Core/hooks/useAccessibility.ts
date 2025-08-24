import { useCallback } from 'react';
import type { SchedulerPlan, EmployeeAssignment } from '@/components/types/types';

interface AccessibilityOptions {
    planId: string;
}

interface UseAccessibilityReturn {
    getPlanTabAriaLabel: (plan: SchedulerPlan) => string;
    getPlanTabAriaDescribedBy: (plan: SchedulerPlan) => string;
    getPlanTabAriaDescription: (plan: SchedulerPlan) => string;
    getAssignmentAriaLabel: (assignment: EmployeeAssignment) => string;
    getAssignmentAriaDescribedBy: (assignment: EmployeeAssignment) => string;
    getAssignmentAriaDescription: (assignment: EmployeeAssignment) => string;
    getBoardAriaLabel: () => string;
    getBoardAriaDescribedBy: () => string;
    getBoardAriaDescription: () => string;
    getFieldAriaLabel: (field: string) => string;
    getFieldAriaDescribedBy: (field: string) => string;
    getFieldAriaDescription: (field: string) => string;
    getTimeSlotAriaLabel: (timeSlotId: string) => string;
    getTimeSlotAriaDescribedBy: (timeSlotId: string) => string;
    getTimeSlotAriaDescription: (timeSlotId: string) => string;
}

export function useAccessibility({ planId }: AccessibilityOptions): UseAccessibilityReturn {
    const getPlanTabAriaLabel = useCallback((plan: SchedulerPlan) => {
        return `Plan tab: ${plan.name}`;
    }, []);

    const getPlanTabAriaDescribedBy = useCallback((plan: SchedulerPlan) => {
        return `plan-tab-description-${plan.id}`;
    }, []);

    const getPlanTabAriaDescription = useCallback((plan: SchedulerPlan) => {
        return `Click to view and edit the ${plan.name} plan`;
    }, []);

    const getAssignmentAriaLabel = useCallback((assignment: EmployeeAssignment) => {
        return `Assignment: ${assignment.name}`;
    }, []);

    const getAssignmentAriaDescribedBy = useCallback((assignment: EmployeeAssignment) => {
        return `assignment-description-${assignment.id}`;
    }, []);

    const getAssignmentAriaDescription = useCallback((assignment: EmployeeAssignment) => {
        return `An assignment from ${assignment.startTime} to ${assignment.endTime} in the ${assignment.field} field`;
    }, []);

    const getBoardAriaLabel = useCallback(() => {
        return 'Schedule Board';
    }, []);

    const getBoardAriaDescribedBy = useCallback(() => {
        return 'board-description';
    }, []);

    const getBoardAriaDescription = useCallback(() => {
        return 'Interactive schedule board for managing employee assignments';
    }, []);

    const getFieldAriaLabel = useCallback((field: string) => {
        return `Field: ${field}`;
    }, []);

    const getFieldAriaDescribedBy = useCallback((field: string) => {
        return `field-description-${field}`;
    }, []);

    const getFieldAriaDescription = useCallback((field: string) => {
        return `A column for managing assignments in the ${field} field`;
    }, []);

    const getTimeSlotAriaLabel = useCallback((timeSlotId: string) => {
        return `Time slot ${timeSlotId}`;
    }, []);

    const getTimeSlotAriaDescribedBy = useCallback((timeSlotId: string) => {
        return `time-slot-description-${timeSlotId}`;
    }, []);

    const getTimeSlotAriaDescription = useCallback((timeSlotId: string) => {
        return `Drop zone for scheduling assignments`;
    }, []);

    return {
        getPlanTabAriaLabel,
        getPlanTabAriaDescribedBy,
        getPlanTabAriaDescription,
        getAssignmentAriaLabel,
        getAssignmentAriaDescribedBy,
        getAssignmentAriaDescription,
        getBoardAriaLabel,
        getBoardAriaDescribedBy,
        getBoardAriaDescription,
        getFieldAriaLabel,
        getFieldAriaDescribedBy,
        getFieldAriaDescription,
        getTimeSlotAriaLabel,
        getTimeSlotAriaDescribedBy,
        getTimeSlotAriaDescription,
    };
} 