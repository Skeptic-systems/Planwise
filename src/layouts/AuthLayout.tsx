import React from 'react';
import { AccentColorProvider } from '@/lib/accent-color-context';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <AccentColorProvider>
            {children}
        </AccentColorProvider>
    );
} 