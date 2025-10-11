import { Button } from "@/components/ui/elements/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/elements/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Archive as ArchiveIcon, CheckCircle2, Undo2 } from "lucide-react";
import React, { useEffect, useState } from "react";

interface Session {
  user: {
    id: string;
    email: string;
  };
}

interface ArchivedPlan {
  id: string;
  title: string;
  description: string;
  isTeamPlan: boolean;
  userId: string;
  createdAt: string;
  archived: boolean;
}

interface ArchiveProps {
  session: Session;
}

export function Archive({ session }: ArchiveProps) {
  const [archivedPlans, setArchivedPlans] = useState<ArchivedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchArchivedPlans();
  }, [session]);

  const fetchArchivedPlans = async () => {
    try {
      if (!session?.user?.id) return;

      // For now, show empty state since we're using simple deletion
      setArchivedPlans([]);
    } catch (error: any) {
      console.error("Error fetching archived plans:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch archived plans",
        icon: <AlertCircle className="h-5 w-5 text-red-400" />,
        className: "border-red-500",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (archivedPlan: ArchivedPlan) => {
    try {
      const res = await fetch("/api/plan-operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "restore",
          planId: archivedPlan.id,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      toast({
        title: "Plan Restored",
        description: `${archivedPlan.title} has been restored successfully`,
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
        className: "border-emerald-500",
      });

      // Refresh the archived plans list
      fetchArchivedPlans();
    } catch (error: any) {
      console.error("Error restoring plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to restore plan",
        icon: <AlertCircle className="h-5 w-5 text-red-400" />,
        className: "border-red-500",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (archivedPlans.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <ArchiveIcon className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No archived plans</h3>
        <p className="text-gray-500">
          Plans you archive will be permanently deleted from the main view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {archivedPlans.map((archivedPlan) => (
        <Card key={archivedPlan.id} className="border-gray-200">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {archivedPlan.title}
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-gray-500">
                  {archivedPlan.description || "No description"}
                </CardDescription>
                <div className="mt-2 text-xs text-gray-400">
                  Archived on {new Date(archivedPlan.createdAt).toLocaleDateString()}
                </div>
              </div>
              <Button
                onClick={() => handleRestore(archivedPlan)}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Restore
              </Button>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
