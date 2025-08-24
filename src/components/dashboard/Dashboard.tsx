import React, { useState, useEffect } from 'react';
import { type Session } from '@supabase/supabase-js';
import Sidebar from './Sidebar';
import { Button } from '@/components/ui/elements/button';
import { Plus, Search, Filter } from 'lucide-react';
import { CreatePlanDialog } from './dialog/CreatePlanDialog';
import { PlanList } from './PlanList';
import { Toaster } from '@/components/ui/feedback/toaster';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/elements/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DashboardProps {
    session: Session | null;
}

interface PlanStats {
    total: number;
    active: number;
    recentlyModified: number;
}

const getGradientByAccentColor = (accentColor: string) => {
    switch (accentColor) {
        case 'blue':
            return 'from-blue-500 to-blue-600';
        case 'purple':
            return 'from-purple-500 to-purple-600';
        case 'orange':
            return 'from-orange-500 to-orange-600';
        case 'green':
            return 'from-emerald-500 to-emerald-600';
        default:
            return 'from-blue-500 to-blue-600';
    }
};

export default function Dashboard({ session }: DashboardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [stats, setStats] = useState<PlanStats>({ total: 0, active: 0, recentlyModified: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'personal' | 'team'>('all');
    const [accentColor, setAccentColor] = useState<string | null>(null);
    const [welcomeName, setWelcomeName] = useState<string>(''); // dynamic name from DB

    const refreshPlans = () => setRefreshTrigger(prev => prev + 1);

    // load display name from profiles with fallback
    useEffect(() => {
        let cancelled = false;
        const loadName = async () => {
            const fallback =
                session?.user?.user_metadata?.display_name ||
                session?.user?.email?.split('@')[0] ||
                '';
            if (!session?.user?.id) { if (!cancelled) setWelcomeName(fallback); return; }

            const { data, error } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', session.user.id)
                .single();

            if (!cancelled) setWelcomeName(data?.display_name || fallback);
        };
        loadName();

        // optional: react to external profile updates
        const h = () => loadName();
        window.addEventListener('profile:updated', h as EventListener);
        return () => { cancelled = true; window.removeEventListener('profile:updated', h as EventListener); };
    }, [session?.user?.id]);

    useEffect(() => {

    }, [session, refreshTrigger]);

    useEffect(() => {
        async function fetchPlanStats() {
            if (!session?.user?.id) {
                return { total: 0, active: 0, recentlyModified: 0 };
            }
            try {
                const res = await fetch('/api/plans', { method: 'GET', credentials: 'include' });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const list: any[] = await res.json();

                const byId = new Map<string, any>();
                (list || []).forEach(p => byId.set(p.id, p));
                const unique = Array.from(byId.values());
                const isTrue = (v: any) => v === true || v === 1 || v === '1';
                const total = unique.length;
                const active = unique.filter(p => !isTrue(p.is_archived)).length;

                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const recentlyModified = unique.filter(p => {
                    const d = new Date(p.updated_at || p.created_at);
                    return d > oneWeekAgo;
                }).length;

                return { total, active, recentlyModified };
            } catch (error) {
                console.error('Error fetching plan stats:', error);
                return { total: 0, active: 0, recentlyModified: 0 };
            }
        }

        async function fetchUserAccentColor() {
            if (!session?.user?.id) return 'blue';
            try {
                const res = await fetch('/api/profile', { method: 'GET', credentials: 'include' });
                if (!res.ok) return 'blue';
                const profile = await res.json();
                return (profile?.accent_color as string) || 'blue';
            } catch (error) {
                console.error('Error fetching user accent color:', error);
                return 'blue';
            }
        }

        async function fetchInitialData() {
            if (!session?.user?.id) {
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                const [statsResult, accentColorResult] = await Promise.all([
                    fetchPlanStats(),
                    fetchUserAccentColor()
                ]);
                setStats(statsResult);
                setAccentColor(accentColorResult);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchInitialData();
    }, [session, refreshTrigger]);

    if (isLoading) {
        return (
            <div className="flex h-screen bg-gradient-to-b from-gray-900 to-black">
                <Sidebar session={session} />
                <main className="flex-1 overflow-auto">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="flex justify-between items-center mb-12">
                            <Skeleton className="h-12 w-64" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <Skeleton className="h-32 rounded-lg" />
                            <Skeleton className="h-32 rounded-lg" />
                            <Skeleton className="h-32 rounded-lg" />
                        </div>
                        <div className="flex gap-4 mb-8">
                            <Skeleton className="h-10 flex-1" />
                            <Skeleton className="h-10 w-[180px]" />
                        </div>
                        <Skeleton className="h-24 rounded-lg" />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gradient-to-b from-gray-900 to-black">
            <Sidebar session={session} />
            <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h1 className={`text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${getGradientByAccentColor(accentColor || 'blue')} mb-2`}>
                                Welcome back, {welcomeName || session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0]}
                            </h1>
                            <p className="text-gray-400">
                                Manage and organize your plans efficiently
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsCreateDialogOpen(true)}
                            className={`flex items-center gap-2 bg-gradient-to-r ${getGradientByAccentColor(accentColor || 'blue')} hover:opacity-90 text-white`}
                        >
                            <Plus className="w-4 h-4" />
                            Create Plan
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                            <h3 className="text-2xl font-bold text-white mb-1">Total Plans</h3>
                            <p className="text-gray-400">{stats.total}</p>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                            <h3 className="text-2xl font-bold text-white mb-1">Active Plans</h3>
                            <p className="text-gray-400">{stats.active}</p>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                            <h3 className="text-2xl font-bold text-white mb-1">Recently Modified</h3>
                            <p className="text-gray-400">{stats.recentlyModified}</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Search plans..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500"
                            />
                        </div>
                        <Select value={filterType} onValueChange={(value: 'all' | 'personal' | 'team') => setFilterType(value)}>
                            <SelectTrigger className="w-[180px] bg-gray-900/50 border-gray-800 text-white">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-800">
                                <SelectItem value="all" className="text-white hover:bg-gray-800">All Plans</SelectItem>
                                <SelectItem value="personal" className="text-white hover:bg-gray-800">Personal</SelectItem>
                                <SelectItem value="team" className="text-white hover:bg-gray-800">Team</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <PlanList
                        session={session}
                        refreshTrigger={refreshTrigger}
                        onPlanUpdated={refreshPlans}
                        searchQuery={searchQuery}
                        filterType={filterType}
                    />
                </div>

                <CreatePlanDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    session={session}
                    onPlanCreated={refreshPlans}
                />
            </main>
            <Toaster />
        </div>
    );
}
