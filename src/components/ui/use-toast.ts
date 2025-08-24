export interface ToastOptions {
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
}

export function useToast() {
    const toast = (options: ToastOptions) => {
        // For now, we'll just console.log the toast
        // Later we can integrate a proper toast library
        console.log(`[${options.variant || 'default'}] ${options.title}: ${options.description}`);
    };

    return { toast };
} 