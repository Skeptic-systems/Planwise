import React, { useEffect, useState } from 'react';
import { type Session } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/overlays/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/elements/button";
import { Input } from "@/components/ui/elements/input";
import { Label } from "@/components/ui/elements/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/elements/switch";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/feedback/toast";
import { supabase } from '@/lib/supabase';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Plan {
  id: string;
  title: string;
  description: string | null;
  is_team_plan: boolean | number | '0' | '1';
  user_id: string;
  created_at?: string;
}

const toMySqlDatetime = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

interface EditPlanDialogProps {
  plan: Plan;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  session: Session | null;
  onPlanDeleted: () => void;
}

export function EditPlanDialog({ plan, open, onOpenChange, session, onPlanDeleted }: EditPlanDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(plan.title);
  const [description, setDescription] = useState(plan.description ?? '');
  const [isTeamPlan, setIsTeamPlan] = useState<boolean>(plan.is_team_plan === true || plan.is_team_plan === 1 || plan.is_team_plan === '1');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [undoSnapshot, setUndoSnapshot] = useState<{ plan: Plan; members: any[] } | null>(null);

  useEffect(() => {
    setTitle(plan.title);
    setDescription(plan.description ?? '');
    setIsTeamPlan(plan.is_team_plan === true || plan.is_team_plan === 1 || plan.is_team_plan === '1');
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('plans')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          is_team_plan: isTeamPlan ? 1 : 0
        })
        .eq('id', plan.id);

      if (error) throw error;

      toast({ title: "Saved", description: "Plan updated", className: "border-emerald-500" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message || "Failed to save", className: "border-red-500" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!session?.user?.id) return;
    try {
      let planMembers: any[] = [];
      if (isTeamPlan) {
        const { data: members, error: mErr } = await supabase.from('plan_members').select('*').eq('plan_id', plan.id);
        if (mErr) throw mErr;
        planMembers = members || [];
      }
      const { error: archiveError } = await supabase.from('plan_archive').insert([{
        plan_id: plan.id,
        plan_data: JSON.stringify({ ...plan, members: planMembers }),
        user_id: session.user.id,
        owner_id: plan.user_id,
        archived_at: toMySqlDatetime(new Date())
      }]);
      if (archiveError) throw archiveError;

      toast({ title: "Archived", description: "Plan moved to archive", className: "border-emerald-500" });
      onOpenChange(false);
      onPlanDeleted();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message || "Failed to archive", className: "border-red-500" });
    }
  };

  const handleDelete = async () => {
    try {
      let members: any[] = [];
      if (isTeamPlan) {
        const { data: mem } = await supabase.from('plan_members').select('*').eq('plan_id', plan.id);
        members = mem || [];
      }
      setUndoSnapshot({ plan, members });

      const { data: fields } = await supabase.from('fields').select('id').eq('plan_id', plan.id);
      const fieldIds = (fields || []).map((f: any) => f.id);
      if (fieldIds.length) await supabase.from('assignments').delete().in('field_id', fieldIds);
      await supabase.from('fields').delete().eq('plan_id', plan.id);
      await supabase.from('plan_tabs').delete().eq('plan_id', plan.id);
      await supabase.from('plan_members').delete().eq('plan_id', plan.id);
      await supabase.from('plan_archive').delete().eq('plan_id', plan.id);
      const { error: delErr } = await supabase.from('plans').delete().eq('id', plan.id);
      if (delErr) throw delErr;

      setShowDeleteDialog(false);
      onOpenChange(false);
      onPlanDeleted();

      toast({
        title: "Plan deleted",
        description: "You can undo this action.",
        action: (<ToastAction altText="Undo delete" onClick={handleUndoDelete}>Undo</ToastAction>),
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message || "Failed to delete plan", className: "border-red-500" });
    }
  };

  const handleUndoDelete = async () => {
    if (!undoSnapshot) return;
    const { plan: snapPlan, members } = undoSnapshot;
    try {
      const { error: restoreError } = await supabase.from('plans').insert([{
        id: snapPlan.id,
        title: snapPlan.title,
        description: snapPlan.description,
        is_team_plan: (snapPlan.is_team_plan === true || snapPlan.is_team_plan === 1 || snapPlan.is_team_plan === '1') ? 1 : 0,
        user_id: snapPlan.user_id,
        created_at: snapPlan.created_at || toMySqlDatetime(new Date())
      }]);
      if (restoreError) throw restoreError;

      if (Array.isArray(members) && members.length) {
        const payload = members.map((m: any) => ({
          id: m.id,
          plan_id: m.plan_id,
          user_id: m.user_id,
          role: m.role,
          created_at: m.created_at || toMySqlDatetime(new Date())
        }));
        const { error: memErr } = await supabase.from('plan_members').insert(payload);
        if (memErr) throw memErr;
      }

      toast({ title: "Restored", description: "Plan was restored", className: "border-emerald-500" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message || "Failed to restore plan", className: "border-red-500" });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {}
        <DialogContent className="sm:max-w-[640px] px-6 py-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>Make changes to your plan here. Click save when you're done.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter plan title"
                required
                className="!bg-transparent !text-white placeholder:!text-white/60 focus-visible:ring-0 focus:outline-none focus-visible:outline-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter plan description"
                rows={4}
                className="resize-y"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="team-plan" className="text-base">Team Plan</Label>
                <p className="text-sm text-muted-foreground">
                  {isTeamPlan ? 'Collaborate with others on this plan' : 'Keep this plan private'}
                </p>
              </div>
              <Switch id="team-plan" checked={isTeamPlan} onCheckedChange={(v) => setIsTeamPlan(!!v)} />
            </div>

            <DialogFooter className="flex justify-between gap-3">
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleArchive}>Archive Plan</Button>
                <Button type="button" variant="destructive" onClick={() => setShowDeleteDialog(true)} className="hover:bg-white hover:text-black transition-colors">
                  Delete Plan
                </Button>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-white hover:text-black">
                  {isSaving ? <><AlertCircle className="w-4 h-4 mr-2" /> Saving...</> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Save Changes</>}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sm:max-w-[560px] px-6 py-6 max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the plan. This cannot be undone.
              Please type <span className="font-semibold">{plan.title}</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type plan title to confirm"
              className="!bg-transparent !text-white placeholder:!text-white/60 focus-visible:ring-0 focus:outline-none focus-visible:outline-none"
            />
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteConfirmation !== plan.title} className="hover:bg-white hover:text-black transition-colors">
                Delete Permanently
              </Button>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
