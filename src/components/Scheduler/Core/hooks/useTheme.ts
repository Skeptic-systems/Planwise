import { useEffect, useState, useCallback } from 'react';
import { SCHEDULER_CONSTANTS } from '../constants';

type Theme = 'light' | 'dark';

interface ThemeColors {
    background: string;
    text: string;
    border: string;
    hover: string;
    active: string;
}

const THEME_COLORS: Record<Theme, ThemeColors> = {
    light: {
        background: 'bg-white',
        text: 'text-gray-900',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-50',
        active: 'bg-blue-50',
    },
    dark: {
        background: 'bg-gray-900',
        text: 'text-white',
        border: 'border-gray-700',
        hover: 'hover:bg-gray-800',
        active: 'bg-blue-900',
    },
};

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('scheduler-theme') as Theme) || 'light';
        }
        return 'light';
    });

    const colors = THEME_COLORS[theme];

    useEffect(() => {
        localStorage.setItem('scheduler-theme', theme);
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }, []);

    const getAssignmentColors = useCallback((assignment: any) => {
        const baseColors = {
            background: colors.background,
            text: colors.text,
            border: colors.border,
        };

        if (assignment.color) {
            return {
                ...baseColors,
                background: assignment.color,
                text: 'text-white',
            };
        }

        return baseColors;
    }, [colors]);

    const getTimeGridColors = useCallback(() => {
        return {
            background: colors.background,
            text: colors.text,
            border: colors.border,
        };
    }, [colors]);

    const getFieldColumnColors = useCallback(() => {
        return {
            background: colors.background,
            text: colors.text,
            border: colors.border,
            hover: colors.hover,
        };
    }, [colors]);

    return {
        theme,
        colors,
        toggleTheme,
        getAssignmentColors,
        getTimeGridColors,
        getFieldColumnColors,
    };
} 