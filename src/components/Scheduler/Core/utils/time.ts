import { SCHEDULER_CONSTANTS } from '../constants';
import type { ShiftPart } from '@/components/Scheduler/types';

export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function isOvernightShift(startTime: string, endTime: string): boolean {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    return endMinutes < startMinutes;
}

export function calculateShiftDisplay(startTime: string, endTime: string): ShiftPart[] {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const midnightMinutes = 24 * 60;
    const { PIXELS_PER_HOUR } = SCHEDULER_CONSTANTS.LAYOUT;

    // If end time is earlier than start time, it's an overnight shift
    if (endMinutes < startMinutes) {
        // Calculate the total duration considering the midnight crossing
        const firstPartDuration = midnightMinutes - startMinutes;
        const secondPartDuration = endMinutes;

        // Ensure heights are non-negative and properly calculated
        const firstPartHeight = Math.max(0, (firstPartDuration / 60)) * PIXELS_PER_HOUR;
        const secondPartHeight = Math.max(0, (secondPartDuration / 60)) * PIXELS_PER_HOUR;

        return [
            {
                startMinutes,
                height: firstPartHeight,
                isOvernight: true,
                isFirstPart: true,
                displayTime: startTime
            },
            {
                startMinutes: 0,
                height: secondPartHeight,
                isOvernight: true,
                isSecondPart: true,
                displayTime: endTime
            }
        ];
    }

    // Regular shift (not overnight)
    const duration = endMinutes - startMinutes;
    const height = Math.max(0, (duration / 60)) * PIXELS_PER_HOUR;
    
    return [{
        startMinutes,
        height,
        isOvernight: false,
        displayTime: startTime
    }];
}

export function formatTimeForDisplay(date: Date): string {
    return date.toLocaleTimeString('en-US', SCHEDULER_CONSTANTS.TIME_FORMAT.HOURS);
}

export function parseTimeString(timeString: string): Date {
    return new Date(`1970-01-01T${timeString}`);
} 