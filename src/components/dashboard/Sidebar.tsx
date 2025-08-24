import React, { useState, useEffect } from "react";
import type { Session } from '@supabase/supabase-js';
import { LayoutDashboard, Archive, Settings, LogOut, BarChart } from 'lucide-react';
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

interface SidebarProps {
    session: Session | null;
}

const ACCENT_COLORS = [
    { id: 'blue', gradient: 'from-blue-500 to-blue-600', text: 'text-blue-500', hover: 'hover:text-blue-400' },
    { id: 'purple', gradient: 'from-purple-500 to-purple-600', text: 'text-purple-500', hover: 'hover:text-purple-400' },
    { id: 'orange', gradient: 'from-orange-500 to-orange-600', text: 'text-orange-500', hover: 'hover:text-orange-400' },
    { id: 'green', gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-500', hover: 'hover:text-emerald-400' },
];

const Logo = React.memo(() => (
    <a href="/" className="flex items-center gap-3 px-2 mb-8 hover:opacity-80 transition-opacity">
        <img
            src="/whiteplanwise.svg"
            alt="Planwise Logo"
            width={32}
            height={32}
            className="object-contain"
        />
        <span className="text-xl font-semibold text-white">
            Planwise
        </span>
    </a>
));
Logo.displayName = 'Logo';

const SidebarSkeleton = React.memo(() => (
    <aside className="w-64 bg-background h-full p-4 shadow-lg flex flex-col">
        <div className="flex items-center gap-3 px-2 mb-8">
            <Skeleton className="w-8 h-8 rounded" />
            <Skeleton className="w-24 h-6" />
        </div>
        <nav className="flex-1 space-y-1">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
        </nav>
        <div className="border-t mt-4 pt-4 space-y-1">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
        </div>
    </aside>
));
SidebarSkeleton.displayName = 'SidebarSkeleton';

const NavLinks = React.memo(({ accentClasses }: { accentClasses: any }) => (
    <nav className="flex-1 space-y-1">
        <a
            href="/dashboard"
            className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-secondary/80",
                accentClasses.text,
                accentClasses.hover
            )}
        >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
        </a>
        {}
        <a
            href="/archive"
            className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-secondary/80",
                accentClasses.text,
                accentClasses.hover
            )}
        >
            <Archive className="w-5 h-5" />
            Archive
        </a>
    </nav>
));
NavLinks.displayName = 'NavLinks';

const BottomSection = React.memo(({ 
    accentClasses, 
    isLoggingOut, 
    onLogout 
}: { 
    accentClasses: any;
    isLoggingOut: boolean;
    onLogout: (e: React.FormEvent) => Promise<void>;
}) => (
    <div className="border-t mt-4 pt-4 space-y-1">
        <a
            href="/settings"
            className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-secondary/80",
                accentClasses.text,
                accentClasses.hover
            )}
        >
            <Settings className="w-5 h-5" />
            Settings
        </a>
        <form onSubmit={onLogout}>
            <button
                type="submit"
                disabled={isLoggingOut}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    "text-red-400 hover:bg-red-500/10",
                    isLoggingOut && "opacity-50 cursor-not-allowed"
                )}
            >
                <LogOut className="w-5 h-5" />
                {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
        </form>
    </div>
));
BottomSection.displayName = 'BottomSection';

export default function Sidebar({ session }: SidebarProps) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [accentColor, setAccentColor] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAccentColor() {
            if (!session?.user?.id) {
                setAccentColor(ACCENT_COLORS[0].id);
                setIsLoading(false);
                return;
            }
            
            try {
            const res = await fetch('/api/profile', { method: 'GET', credentials: 'include' });
                if (res.ok) {
                const profile = await res.json();
                setAccentColor((profile?.accent_color as string) || ACCENT_COLORS[0].id);
            } else {
                setAccentColor(ACCENT_COLORS[0].id);
            }

            } catch (error) {
                console.error('Error fetching accent color:', error);
                setAccentColor(ACCENT_COLORS[0].id);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAccentColor();
    }, [session]);

    const handleLogout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoggingOut) return;

        try {
            setIsLoggingOut(true);
            await fetch('/api/auth/signout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            window.location.href = '/login';
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    if (isLoading) {
        return <SidebarSkeleton />;
    }

    const accentClasses = ACCENT_COLORS.find(c => c.id === accentColor) || ACCENT_COLORS[0];

    return (
        <aside className="w-64 bg-background h-full p-4 shadow-lg flex flex-col">
            <Logo />
            <NavLinks accentClasses={accentClasses} />
            <BottomSection 
                accentClasses={accentClasses}
                isLoggingOut={isLoggingOut}
                onLogout={handleLogout}
            />
        </aside>
    );
}
