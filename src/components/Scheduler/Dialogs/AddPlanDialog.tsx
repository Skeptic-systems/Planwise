import { useState } from "react";
import { Button } from "@/components/ui/elements/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/overlays/dialog";
import { Input } from "@/components/ui/elements/input";
import {PlusIcon} from "lucide-react";

interface AddPlanDialogProps {
    addPlan: (planName: string) => void;
}

export function AddPlanDialog({ addPlan }: AddPlanDialogProps) {
    const [planName, setPlanName] = useState("");

    const handleAddPlan = () => {
        if (planName.trim() !== "") {
            addPlan(planName.trim());
            setPlanName("");
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost"> <PlusIcon></PlusIcon> </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add new Tab</DialogTitle>
                </DialogHeader>
                <Input
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="Name des Plans"
                />
                <Button onClick={handleAddPlan} className="mt-4">
                    Erstellen
                </Button>
            </DialogContent>
        </Dialog>
    );
}
