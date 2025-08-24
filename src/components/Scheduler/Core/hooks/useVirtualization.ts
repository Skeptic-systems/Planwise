import { useState, useCallback, useEffect, useRef } from 'react';

interface VirtualizationOptions {
    itemHeight: number;
    overscan?: number;
    containerHeight: number;
}

interface VirtualizationState<T> {
    startIndex: number;
    endIndex: number;
    totalHeight: number;
    visibleItems: T[];
}

export function useVirtualization<T>(
    items: T[],
    { itemHeight, overscan = 3, containerHeight }: VirtualizationOptions
) {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const getVirtualizationState = useCallback((): VirtualizationState<T> => {
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
        const endIndex = Math.min(items.length, startIndex + visibleCount);
        const totalHeight = items.length * itemHeight;

        return {
            startIndex,
            endIndex,
            totalHeight,
            visibleItems: items.slice(startIndex, endIndex),
        };
    }, [scrollTop, itemHeight, overscan, containerHeight, items]);

    const handleScroll = useCallback(() => {
        if (containerRef.current) {
            setScrollTop(containerRef.current.scrollTop);
        }
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

    const scrollToIndex = useCallback((index: number) => {
        if (containerRef.current) {
            containerRef.current.scrollTop = index * itemHeight;
        }
    }, [itemHeight]);

    const { startIndex, endIndex, totalHeight, visibleItems } = getVirtualizationState();

    return {
        containerRef,
        startIndex,
        endIndex,
        totalHeight,
        visibleItems,
        scrollToIndex,
    };
} 