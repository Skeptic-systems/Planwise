import { useCallback } from 'react';

interface ErrorHandlingOptions {
    planId: string;
}

interface UseErrorHandlingReturn {
    handleError: (error: Error, context: string) => void;
}

export function useErrorHandling({ planId }: ErrorHandlingOptions): UseErrorHandlingReturn {
    const handleError = useCallback((error: Error, context: string) => {
        console.error(`Error in ${context} for plan ${planId}:`, error);
        // Here you would typically:
        // 1. Log the error to your error tracking service
        // 2. Show a user-friendly error message
        // 3. Potentially trigger a fallback behavior
    }, [planId]);

    return {
        handleError,
    };
} 