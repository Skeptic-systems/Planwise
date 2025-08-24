import React, { useState } from 'react';
import { type Session } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/overlays/dialog';
import { Button } from '@/components/ui/elements/button';
import { Input } from '@/components/ui/elements/input';
import { Label } from '@/components/ui/elements/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/elements/switch';
import { useToast } from '@/hooks/use-toast';
import { Users, User, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onPlanCreated: () => void;
}

export function CreatePlanDialog({ open, onOpenChange, session, onPlanCreated }: CreatePlanDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isTeamPlan, setIsTeamPlan] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast({ variant: "destructive", title: "Error", description: "No session" });
      return;
    }
    if (!title.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Title is required" });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          is_team_plan: isTeamPlan
        })
      });

      if (!res.ok) {
        const er = await res.json().catch(() => ({}));
        throw new Error(er?.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data?.id) throw new Error("Create failed");

      toast({ title: "Success", description: "Plan created successfully", className: "border-emerald-500" });
      onOpenChange(false);
      onPlanCreated();

      setTitle('');
      setDescription('');
      setIsTeamPlan(false);
    } catch (error: any) {
      console.error('Create plan error:', error);
      toast({ variant: "destructive", title: "Error", description: error?.message || "Failed to create plan" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Plan</DialogTitle>
          <DialogDescription>Create a new plan to start organizing your schedule.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My plan..."
              className="!bg-transparent !text-white placeholder:!text-white/60 focus-visible:ring-0 focus:outline-none focus-visible:outline-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isTeamPlan ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
              <span>Team plan</span>
            </div>
            <Switch checked={isTeamPlan} onCheckedChange={(v) => setIsTeamPlan(!!v)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><AlertCircle className="w-4 h-4 mr-2" /> Saving...</> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Create</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
