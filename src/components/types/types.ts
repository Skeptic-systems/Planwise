// src/components/types/types.ts
export interface EmployeeAssignment {
    id: string;
    name: string;
    email: string;
    field: string;
    startTime: string;
    endTime: string;
    color: string;
    planId: string;
}

export interface TimeSlot {
    id: string;
    plan_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
}

export interface Schedule {
    id: string;
    plan_id: string;
    user_id: string;
    date: string;
    start_time: string;
    end_time: string;
    title: string;
    description?: string;
}

export interface SchedulerPlan {
    id: string;
    name: string;
    fields: string[];
    assignments: EmployeeAssignment[];
    type: "personal" | "team";
    tabId: string;
    planId: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    color?: string;
    description?: string;
    attendees?: string[];
    allDay?: boolean;
    location?: string;
}