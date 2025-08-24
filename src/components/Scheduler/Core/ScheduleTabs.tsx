import { EditablePlanTab } from "./EditablePlanTab";
import type {SchedulerPlan} from "@/components/types/types.ts";
import {AddPlanDialog} from "@/components/Scheduler/Dialogs/AddPlanDialog.tsx";
import type { Session } from '@supabase/supabase-js';

interface ScheduleTabsProps {
    plans: SchedulerPlan[];
    activePlanId: string;
    setActivePlanId: (id: string) => void;
    addPlan: (planName: string) => void;
    updatePlanName: (planId: string, newName: string) => void;
    deletePlan: (planId: string) => void;
    session: Session | null;
}

export function ScheduleTabs({
                                 plans,
                                 activePlanId,
                                 setActivePlanId,
                                 addPlan,
                                 updatePlanName,
                                 deletePlan,
                                 session,
                             }: ScheduleTabsProps) {
    return (
        <div className="flex items-center border-b border-gray-200 mb-4">
            {plans.map((plan) => (
                <EditablePlanTab
                    key={plan.id}
                    plan={plan}
                    isActive={plan.id === activePlanId}
                    onSelect={setActivePlanId}
                    updatePlanName={updatePlanName}
                    deletePlan={deletePlan}
                    session={session}
                />
            ))}
            <AddPlanDialog addPlan={addPlan} />
        </div>
    );
}
