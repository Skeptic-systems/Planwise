import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/elements/button";
import { Input } from "@/components/ui/elements/input";
import { Label } from "@/components/ui/elements/label";
import { Switch } from "@/components/ui/elements/switch";
import { ToastAction } from "@/components/ui/feedback/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/overlays/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Session } from "@/lib/types";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

interface Plan {
  id: string;
  title: string;
  description: string | null;
  isTeamPlan: boolean | number | "0" | "1";
  userId: string;
  createdAt?: string;
}

const toMySqlDatetime = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

interface EditPlanDialogProps {
  plan: Plan;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  session: Session | null;
  onPlanDeleted: () => void;
}

export function EditPlanDialog({
  plan,
  open,
  onOpenChange,
  session,
  onPlanDeleted,
}: EditPlanDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(plan.title);
  const [description, setDescription] = useState(plan.description ?? "");
  const [isTeamPlan, setIsTeamPlan] = useState<boolean>(
    plan.isTeamPlan === true || plan.isTeamPlan === 1 || plan.isTeamPlan === "1",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    setTitle(plan.title);
    setDescription(plan.description ?? "");
    setIsTeamPlan(plan.isTeamPlan === true || plan.isTeamPlan === 1 || plan.isTeamPlan === "1");
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      const response = await fetch("/api/plan-operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "update",
          planId: plan.id,
          name: title.trim(),
          description: description.trim() || null,
          isTeamPlan: isTeamPlan ? 1 : 0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update plan");
      }

      toast({ title: "Saved", description: "Plan updated", className: "border-emerald-500" });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to save",
        className: "border-red-500",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch("/api/plan-operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "archive",
          planId: plan.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive plan");
      }

      toast({
        title: "Archived",
        description: "Plan moved to archive",
        className: "border-emerald-500",
      });
      onOpenChange(false);
      onPlanDeleted();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to archive",
        className: "border-red-500",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch("/api/plan-operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "delete",
          planId: plan.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete plan");
      }

      setShowDeleteDialog(false);
      onOpenChange(false);
      onPlanDeleted();

      toast({
        title: "Plan deleted",
        description: "Plan has been permanently deleted.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.message || "Failed to delete plan",
        className: "border-red-500",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {}
        <DialogContent className="sm:max-w-[640px] px-6 py-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Make changes to your plan here. Click save when you're done.
            </DialogDescription>
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
                <Label htmlFor="team-plan" className="text-base">
                  Team Plan
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isTeamPlan ? "Collaborate with others on this plan" : "Keep this plan private"}
                </p>
              </div>
              <Switch
                id="team-plan"
                checked={isTeamPlan}
                onCheckedChange={(v) => setIsTeamPlan(!!v)}
              />
            </div>

            <DialogFooter className="flex justify-between gap-3">
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleArchive}>
                  Archive Plan
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="hover:bg-white hover:text-black transition-colors"
                >
                  Delete Plan
                </Button>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-primary hover:bg-white hover:text-black"
                >
                  {isSaving ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Save Changes
                    </>
                  )}
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
              This action will permanently delete the plan. This cannot be undone. Please type{" "}
              <span className="font-semibold">{plan.title}</span> to confirm.
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
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteConfirmation !== plan.title}
                className="hover:bg-white hover:text-black transition-colors"
              >
                Delete Permanently
              </Button>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
