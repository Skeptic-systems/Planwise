import { useCallback, useRef, useEffect } from 'react';
import { useScheduler } from '../context/SchedulerContext';
import { SCHEDULER_CONSTANTS } from '../constants';

interface TransitionOptions {
    duration?: number;
    easing?: string;
    delay?: number;
}

const DEFAULT_OPTIONS: TransitionOptions = {
    duration: 200,
    easing: 'ease-in-out',
    delay: 0,
};

export function useTransitions() {
    const { editorMode } = useScheduler();
    const transitionRefs = useRef<Map<string, HTMLElement>>(new Map());

    const applyTransition = useCallback((element: HTMLElement, options: TransitionOptions = {}) => {
        const { duration, easing, delay } = { ...DEFAULT_OPTIONS, ...options };
        element.style.transition = `all ${duration}ms ${easing} ${delay}ms`;
    }, []);

    const removeTransition = useCallback((element: HTMLElement) => {
        element.style.transition = '';
    }, []);

    const fadeIn = useCallback((element: HTMLElement, options: TransitionOptions = {}) => {
        applyTransition(element, options);
        element.style.opacity = '0';
        element.style.display = 'block';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
    }, [applyTransition]);

    const fadeOut = useCallback((element: HTMLElement, options: TransitionOptions = {}) => {
        applyTransition(element, options);
        element.style.opacity = '1';
        
        requestAnimationFrame(() => {
            element.style.opacity = '0';
        });
    }, [applyTransition]);

    const slideIn = useCallback((element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down', options: TransitionOptions = {}) => {
        applyTransition(element, options);
        const offset = direction === 'left' || direction === 'right' ? '100%' : '20px';
        const transform = direction === 'left' ? 'translateX(-100%)' :
                         direction === 'right' ? 'translateX(100%)' :
                         direction === 'up' ? 'translateY(-20px)' :
                         'translateY(20px)';
        
        element.style.transform = transform;
        element.style.display = 'block';
        
        requestAnimationFrame(() => {
            element.style.transform = 'translate(0)';
        });
    }, [applyTransition]);

    const slideOut = useCallback((element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down', options: TransitionOptions = {}) => {
        applyTransition(element, options);
        const transform = direction === 'left' ? 'translateX(-100%)' :
                         direction === 'right' ? 'translateX(100%)' :
                         direction === 'up' ? 'translateY(-20px)' :
                         'translateY(20px)';
        
        requestAnimationFrame(() => {
            element.style.transform = transform;
        });
    }, [applyTransition]);

    const scaleIn = useCallback((element: HTMLElement, options: TransitionOptions = {}) => {
        applyTransition(element, options);
        element.style.transform = 'scale(0.8)';
        element.style.opacity = '0';
        element.style.display = 'block';
        
        requestAnimationFrame(() => {
            element.style.transform = 'scale(1)';
            element.style.opacity = '1';
        });
    }, [applyTransition]);

    const scaleOut = useCallback((element: HTMLElement, options: TransitionOptions = {}) => {
        applyTransition(element, options);
        element.style.transform = 'scale(1)';
        element.style.opacity = '1';
        
        requestAnimationFrame(() => {
            element.style.transform = 'scale(0.8)';
            element.style.opacity = '0';
        });
    }, [applyTransition]);

    const registerTransition = useCallback((id: string, element: HTMLElement) => {
        transitionRefs.current.set(id, element);
    }, []);

    const unregisterTransition = useCallback((id: string) => {
        transitionRefs.current.delete(id);
    }, []);

    // Cleanup transitions on unmount
    useEffect(() => {
        return () => {
            transitionRefs.current.forEach(element => {
                removeTransition(element);
            });
            transitionRefs.current.clear();
        };
    }, [removeTransition]);

    return {
        fadeIn,
        fadeOut,
        slideIn,
        slideOut,
        scaleIn,
        scaleOut,
        registerTransition,
        unregisterTransition,
        applyTransition,
        removeTransition,
    };
} 