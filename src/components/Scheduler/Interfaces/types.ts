export interface TimeSlot {
    id: string;
    plan_id: string;
    day_of_week: number; // 0-6 for Sunday-Saturday
    start_time: string; // HH:mm format
    end_time: string; // HH:mm format
    is_available: boolean;
}

export interface Schedule {
    id: string;
    plan_id: string;
    user_id: string;
    date: string; // YYYY-MM-DD format
    start_time: string; // HH:mm format
    end_time: string; // HH:mm format
    title: string;
    description?: string;
    status: 'pending' | 'confirmed' | 'cancelled';
}

export interface TeamMember {
    id: string;
    user_id: string;
    plan_id: string;
    role: 'admin' | 'member' | 'viewer';
    email: string;
    name?: string;
}

export interface PlanSettings {
    plan_id: string;
    auto_assign: boolean;
    allow_self_assign: boolean;
    notify_on_assignment: boolean;
    notify_on_changes: boolean;
    max_assignments_per_day: number;
    min_time_between_assignments: number;
} 