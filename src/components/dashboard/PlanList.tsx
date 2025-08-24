import React, { useEffect, useState } from 'react';
import { type Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/elements/card';
import { Badge } from '@/components/ui/badge';
import { Users, User, Pencil, UserPlus, Calendar, Search } from 'lucide-react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/elements/context-menu";
import { EditPlanDialog } from './dialog/EditPlanDialog';
import { InviteMemberDialog } from './dialog/InviteMemberDialog';
import { motion } from "framer-motion";

const ACCENT_COLORS = [
    { id: 'blue',   gradient: 'from-blue-500 to-blue-600',       text: 'text-blue-500',    hover: 'hover:text-blue-400' },
    { id: 'purple', gradient: 'from-purple-500 to-purple-600',   text: 'text-purple-500',  hover: 'hover:text-purple-400' },
    { id: 'orange', gradient: 'from-orange-500 to-orange-600',   text: 'text-orange-500',  hover: 'hover:text-orange-400' },
    { id: 'green',  gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-500', hover: 'hover:text-emerald-400' },
];

interface Plan {
    id: string;
    title: string;
    description: string | null;
    created_at: string;
    user_id: string;
    is_team_plan: boolean | number | '0' | '1';
    is_archived?: boolean | number | '0' | '1';
}

interface PlanListProps {
    session: Session | null;
    refreshTrigger?: number;
    onPlanUpdated?: () => void;
    searchQuery: string;
    filterType: 'all' | 'personal' | 'team';
}

export function PlanList({ session, refreshTrigger, onPlanUpdated, searchQuery, filterType }: PlanListProps) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0].id);
    const { toast } = useToast();
    useEffect(() => {
        if (!session?.user?.id) return;
        (async () => {
            try {
                const res = await fetch('/api/profile', { method: 'GET', credentials: 'include' });
                if (!res.ok) return;
                const profile = await res.json();
                if (profile?.accent_color) setAccentColor(profile.accent_color);
            } catch {}
        })();
    }, [session?.user?.id]);

    const accentClasses = ACCENT_COLORS.find(c => c.id === accentColor) || ACCENT_COLORS[0];
    const normBool = (v: any) => v === true || v === 1 || v === '1';
    const normalizePlan = (p: any): Plan => ({
        ...p,
        description: p?.description ?? '',
        is_team_plan: normBool(p?.is_team_plan),
        is_archived: normBool(p?.is_archived),
    });
    async function fetchPlans() {
        if (!session?.user?.id) return;
        try {
            setIsLoading(true);
            const res = await fetch('/api/plans', { method: 'GET', credentials: 'include' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const list: any[] = await res.json();
            const byId = new Map<string, Plan>();
            (list || []).map(normalizePlan).forEach(p => byId.set(p.id, p));

            const all = Array.from(byId.values())
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setPlans(all);
        } catch (error: any) {
            console.error('Error fetching plans:', error);
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch plans" });
            setPlans([]);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (!session) return;
        fetchPlans();
    }, [session, refreshTrigger]);

    const handlePlanClick = (planId: string) => {
        window.location.href = `/editor/${planId}`;
    };

    const handleEditPlan = (plan: Plan) => {
        setSelectedPlan(plan);
        setIsEditDialogOpen(true);
    };

    const handleInviteMember = (plan: Plan) => {
        if (!normBool(plan.is_team_plan)) {
            handleEditPlan(plan);
            toast({ title: "Info", description: "Convert to team plan first to invite members" });
            return;
        }
        setSelectedPlan(plan);
        setIsInviteDialogOpen(true);
    };

    const handlePlanUpdated = () => {
        fetchPlans();
        onPlanUpdated?.();
    };
    const filteredPlans = plans.filter(plan => {
        const q = (searchQuery || '').toLowerCase();
        const matchesSearch =
            (plan.title || '').toLowerCase().includes(q) ||
            (plan.description || '').toLowerCase().includes(q);

        const isTeam = normBool(plan.is_team_plan);
        const matchesFilter =
            filterType === 'all' ||
            (filterType === 'personal' && !isTeam) ||
            (filterType === 'team' && isTeam);

        return matchesSearch && matchesFilter;
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse bg-gray-900/50 border-gray-800">
                        <CardHeader>
                            <div className="h-12 w-12 rounded-lg bg-gray-800 mb-4"></div>
                            <div className="h-6 bg-gray-800 rounded w-1/2 mb-3"></div>
                            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        );
    }

    if (filteredPlans.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center"
            >
                <div className={`mx-auto w-12 h-12 rounded-lg bg-gradient-to-br ${accentClasses.gradient} flex items-center justify-center mb-4`}>
                    <Search className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No plans yet</h3>
                <p className="text-gray-400 max-w-sm mx-auto">
                    Get started by creating your first plan using the "Create Plan" button above.
                </p>
            </motion.div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPlans.map((plan, i) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <ContextMenu>
                            <ContextMenuTrigger>
                                <Card
                                    className={`group hover:bg-gray-900/50 transition-all duration-300 border-gray-800 hover:border-gray-700 cursor-pointer ${normBool(plan.is_archived) ? 'opacity-75' : ''}`}
                                    onClick={() => handlePlanClick(plan.id)}
                                >
                                    <CardHeader>
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br ${accentClasses.gradient} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300`}>
                                                {normBool(plan.is_team_plan) ? (
                                                    <Users className="w-6 h-6 text-white" />
                                                ) : (
                                                    <User className="w-6 h-6 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <CardTitle className={`text-xl font-semibold ${accentClasses.text} group-hover:text-white/90 truncate`}>
                                                        {plan.title}
                                                    </CardTitle>
                                                    {normBool(plan.is_archived) && (
                                                        <Badge variant="secondary" className="bg-gray-600 text-gray-400 border-0 shrink-0">
                                                            Archived
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardDescription className="text-gray-400 group-hover:text-gray-300 mt-1">
                                                    {plan.description || '—'}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                                            <Calendar className="w-4 h-4" />
                                            <span>Created {new Date(plan.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="bg-gray-900 border-gray-800">
                                <ContextMenuItem className={`${accentClasses.text} hover:bg-gray-800 cursor-pointer`} onClick={() => handleEditPlan(plan)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit Plan
                                </ContextMenuItem>
                                <ContextMenuSeparator className="bg-gray-800" />
                                <ContextMenuItem className={`${accentClasses.text} hover:bg-gray-800 cursor-pointer`} onClick={() => handleInviteMember(plan)}>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    {normBool(plan.is_team_plan) ? 'Invite Member' : 'Convert to Team Plan'}
                                </ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    </motion.div>
                ))}
            </div>

            {selectedPlan && (
                <>
                    <EditPlanDialog
                        plan={selectedPlan}
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                        session={session}
                        onPlanDeleted={handlePlanUpdated}
                    />
                    <InviteMemberDialog
                        plan={selectedPlan}
                        open={isInviteDialogOpen}
                        onOpenChange={setIsInviteDialogOpen}
                    />
                </>
            )}
        </>
    );
}
