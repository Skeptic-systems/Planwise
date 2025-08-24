/** @jsxImportSource react */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useScheduler } from '../context/SchedulerContext';
import { SCHEDULER_CONSTANTS } from '../constants';
import { Tooltip } from '../components/Tooltip';

interface TooltipState {
    isVisible: boolean;
    content: string;
    position: { x: number; y: number };
    targetElement: HTMLElement | null;
}

export function useTooltip() {
    const { editorMode } = useScheduler();
    const [tooltip, setTooltip] = useState<TooltipState>({
        isVisible: false,
        content: '',
        position: { x: 0, y: 0 },
        targetElement: null,
    });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const showTooltip = useCallback((content: string, targetElement: HTMLElement) => {
        if (editorMode !== 'edittime') return;

        const rect = targetElement.getBoundingClientRect();
        const position = {
            x: rect.left + window.scrollX,
            y: rect.bottom + window.scrollY + 5,
        };

        setTooltip({
            isVisible: true,
            content,
            position,
            targetElement,
        });
    }, [editorMode]);

    const hideTooltip = useCallback(() => {
        setTooltip(prev => ({
            ...prev,
            isVisible: false,
            content: '',
            position: { x: 0, y: 0 },
            targetElement: null,
        }));
    }, []);

    const handleMouseEnter = useCallback((content: string, targetElement: HTMLElement) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            showTooltip(content, targetElement);
        }, 200);
    }, [showTooltip]);

    const handleMouseLeave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            hideTooltip();
        }, 100);
    }, [hideTooltip]);

    // Update tooltip position on scroll
    useEffect(() => {
        if (!tooltip.isVisible || !tooltip.targetElement) return;

        const handleScroll = () => {
            const rect = tooltip.targetElement!.getBoundingClientRect();
            setTooltip(prev => ({
                ...prev,
                position: {
                    x: rect.left + window.scrollX,
                    y: rect.bottom + window.scrollY + 5,
                },
            }));
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [tooltip.isVisible, tooltip.targetElement]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const TooltipComponent = useCallback(() => {
        if (!tooltip.isVisible) return null;
        return <Tooltip content={tooltip.content} position={tooltip.position} tooltipRef={tooltipRef} />;
    }, [tooltip.isVisible, tooltip.content, tooltip.position]);

    return {
        showTooltip,
        hideTooltip,
        handleMouseEnter,
        handleMouseLeave,
        TooltipComponent,
    };
} 