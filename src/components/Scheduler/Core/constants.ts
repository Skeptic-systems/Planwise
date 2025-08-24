export const SCHEDULER_CONSTANTS = {
    TIME: {
        START_HOUR: 0,
        END_HOUR: 24,
        MINUTE_STEP: 15,
    },
    LAYOUT: {
        PIXELS_PER_HOUR: 64,
        CANVAS_HEIGHT: 'calc(100vh-12rem)',
    },
    DRAG_AND_DROP: {
        ACTIVATION_DISTANCE: 8,
    },
    COLORS: {
        BORDER: 'border-gray-200',
        TEXT: {
            PRIMARY: 'text-gray-900',
            SECONDARY: 'text-gray-500',
            WHITE: 'text-white',
        },
        BACKGROUND: {
            WHITE: 'bg-white',
            HOVER_RED: 'hover:bg-red-50',
        },
    },
    TIME_FORMAT: {
        HOURS: {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
        },
    },
} as const; 