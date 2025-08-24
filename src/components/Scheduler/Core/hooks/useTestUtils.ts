import { useCallback, useRef } from 'react';
import { useScheduler } from '../context/SchedulerContext';
import { usePlanData } from './usePlanData';
import type { EmployeeAssignment, SchedulerPlan } from '@/components/Scheduler/types';

interface TestUtils {
    generateTestData: (count: number) => SchedulerPlan[];
    simulateDrag: (assignment: EmployeeAssignment, targetField: string) => void;
    simulateResize: (assignment: EmployeeAssignment, newEndTime: string) => void;
    simulateClick: (x: number, y: number) => void;
    getComponentState: () => any;
}

export function useTestUtils({ planId }: { planId: string }): TestUtils {
    const { plans } = usePlanData({ planId });
    const { editorMode } = useScheduler();
    const componentStateRef = useRef<any>(null);

    const generateTestData = useCallback((count: number): SchedulerPlan[] => {
        const testPlans: SchedulerPlan[] = [];
        const fields = ['Field 1', 'Field 2', 'Field 3', 'Field 4', 'Field 5'];
        const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF3333'];

        for (let i = 0; i < count; i++) {
            const assignments: EmployeeAssignment[] = [];
            const assignmentCount = Math.floor(Math.random() * 5) + 1;

            for (let j = 0; j < assignmentCount; j++) {
                const startHour = Math.floor(Math.random() * 20);
                const duration = Math.floor(Math.random() * 4) + 1;
                const field = fields[Math.floor(Math.random() * fields.length)];
                const color = colors[Math.floor(Math.random() * colors.length)];

                assignments.push({
                    id: `test-${i}-${j}`,
                    name: `Test Assignment ${i}-${j}`,
                    field,
                    startTime: `${startHour.toString().padStart(2, '0')}:00`,
                    endTime: `${(startHour + duration).toString().padStart(2, '0')}:00`,
                    color,
                    email: `test${i}${j}@example.com`,
                });
            }

            testPlans.push({
                id: `test-plan-${i}`,
                title: `Test Plan ${i}`,
                fields: fields.map(name => ({ id: `field-${name}`, name, plan_tab_id: `test-plan-${i}` })),
                assignments,
            });
        }

        return testPlans;
    }, []);

    const simulateDrag = useCallback((assignment: EmployeeAssignment, targetField: string) => {
        if (editorMode !== 'edittime') return;

        // Simulate drag start
        const dragStartEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: 0,
            clientY: 0,
        });

        // Simulate drag move
        const dragMoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX: 100,
            clientY: 100,
        });

        // Simulate drag end
        const dragEndEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            clientX: 100,
            clientY: 100,
        });

        // Dispatch events
        document.dispatchEvent(dragStartEvent);
        document.dispatchEvent(dragMoveEvent);
        document.dispatchEvent(dragEndEvent);
    }, [editorMode]);

    const simulateResize = useCallback((assignment: EmployeeAssignment, newEndTime: string) => {
        if (editorMode !== 'edittime') return;

        // Simulate resize start
        const resizeStartEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            clientX: 0,
            clientY: 0,
        });

        // Simulate resize move
        const resizeMoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX: 100,
            clientY: 100,
        });

        // Simulate resize end
        const resizeEndEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            clientX: 100,
            clientY: 100,
        });

        // Dispatch events
        document.dispatchEvent(resizeStartEvent);
        document.dispatchEvent(resizeMoveEvent);
        document.dispatchEvent(resizeEndEvent);
    }, [editorMode]);

    const simulateClick = useCallback((x: number, y: number) => {
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
        });

        document.elementFromPoint(x, y)?.dispatchEvent(clickEvent);
    }, []);

    const getComponentState = useCallback(() => {
        return {
            plans,
            editorMode,
            ...componentStateRef.current,
        };
    }, [plans, editorMode]);

    return {
        generateTestData,
        simulateDrag,
        simulateResize,
        simulateClick,
        getComponentState,
    };
} 