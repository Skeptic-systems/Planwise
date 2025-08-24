import { useState } from "react";
import { Button } from "@/components/ui/elements/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/overlays/dialog";
import { Input } from "@/components/ui/elements/input";
import { SquareChartGantt } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

interface AddFieldDialogProps {
    addField: (field: string) => void;
    fields: string[];
    planId: string;
    planTabId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddFieldDialog({ addField, fields, planId, planTabId, open, onOpenChange }: AddFieldDialogProps) {
    const [newField, setNewField] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAddField = async () => {
        if (!newField) return;
        if (fields.includes(newField)) {
            toast({
                title: "Error",
                description: "This field already exists!",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsLoading(true);
            
            // Call the parent's addField function which handles the database insertion
            await addField(newField);
            setNewField("");
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error adding field:', error);
            toast({
                title: "Error",
                description: `Failed to add field: ${error.message || 'Unknown error'}`,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Field</DialogTitle>
                </DialogHeader>
                <Input
                    className="text-black"
                    value={newField}
                    onChange={(e) => setNewField(e.target.value)}
                    placeholder="Field Name"
                    disabled={isLoading}
                />
                <Button 
                    onClick={handleAddField} 
                    className="mt-4 hover:bg-white hover:text-black"
                    disabled={isLoading}
                >
                    {isLoading ? "Adding..." : "Add Field"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
