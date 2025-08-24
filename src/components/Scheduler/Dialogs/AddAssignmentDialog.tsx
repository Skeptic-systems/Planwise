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
import type { EmployeeAssignment } from "@/components/types/types";
import { PASTEL_COLORS } from "@/components/Hooks/useScheudler";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from '@/hooks/use-toast';

interface AddAssignmentDialogProps {
    fields: string[];
    addAssignment: (assignment: EmployeeAssignment) => Promise<void>;
}

export function AddAssignmentDialog({ fields, addAssignment }: AddAssignmentDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newAssignment, setNewAssignment] = useState<EmployeeAssignment>({
        id: "",
        name: "",
        field: "",
        startTime: "",
        endTime: "",
        color: PASTEL_COLORS[0],
        email: "",
        planId: "",
    });

    const handleAddAssignment = async () => {
        if (
            newAssignment.name &&
            newAssignment.field &&
            newAssignment.startTime &&
            newAssignment.endTime &&
            newAssignment.email
        ) {
            try {
                setIsLoading(true);
                await addAssignment({ ...newAssignment, id: Date.now().toString() });
                setIsOpen(false);
                setNewAssignment({
                    id: "",
                    name: "",
                    field: "",
                    startTime: "",
                    endTime: "",
                    color: PASTEL_COLORS[0],
                    email: "",
                    planId: "",
                });
                toast({
                    title: "Success",
                    description: "Assignment added successfully"
                });
            } catch (error) {
                console.error('Error adding assignment:', error);
                toast({
                    title: "Error",
                    description: "Failed to add assignment. Please try again.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        } else {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive"
            });
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="mt-1 h-8 w-8 hover:bg-muted bg-transparent border-transparent">
                    <UserPlus size={24} />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Assignment</DialogTitle>
                </DialogHeader>
                <Input
                    className="text-black"
                    value={newAssignment.name}
                    onChange={(e) => setNewAssignment({ ...newAssignment, name: e.target.value })}
                    placeholder="Employee Name"
                />
                <Input
                
                    value={newAssignment.email}
                    onChange={(e) => setNewAssignment({ ...newAssignment, email: e.target.value })}
                    placeholder="Employee Email"
                    className="mt-2 text-black"
                />
                <select
                    value={newAssignment.field}
                    onChange={(e) => setNewAssignment({ ...newAssignment, field: e.target.value })}
                    className="bg-secondary mt-2 w-full p-2 border rounded text-black"
                >
                    <option value="">Select Field</option>
                    {fields.map((field) => (
                        <option key={field} value={field}>
                            {field}
                        </option>
                    ))}
                </select>
                <Input
                    type="time"
                    value={newAssignment.startTime}
                    onChange={(e) =>
                        setNewAssignment({ ...newAssignment, startTime: e.target.value })
                    }
                    className="mt-2 text-black"
                />
                <Input
                    type="time"
                    value={newAssignment.endTime}
                    onChange={(e) =>
                        setNewAssignment({ ...newAssignment, endTime: e.target.value })
                    }
                    className="mt-2 text-black"
                />
                <div className="mt-2 ">
                    <label className="text-sm">Select Color</label>
                    <div className="flex space-x-2 mt-2">
                        {PASTEL_COLORS.map((color) => (
                            <div
                                key={color}
                                onClick={() => setNewAssignment({ ...newAssignment, color })}
                                className={`w-8 h-8 rounded-full cursor-pointer ${color} ${
                                    color === newAssignment.color ? "border-2 border-black" : ""
                                }`}
                            />
                        ))}
                    </div>
                    <div className="mt-4 p-4 rounded-md border border-gray-200">
                        <p className="text-sm text-gray-500 mb-2">Preview:</p>
                        <div 
                            className="p-3 rounded-md"
                            style={{
                                borderLeft: `4px solid ${newAssignment.color}`,
                                backgroundColor: `${newAssignment.color}80`
                            }}
                        >
                            <p className="text-sm font-medium">{newAssignment.name || "Employee Name"}</p>
                            <p className="text-xs text-gray-600">
                                {newAssignment.startTime && newAssignment.endTime 
                                    ? `${newAssignment.startTime} - ${newAssignment.endTime}`
                                    : "Start Time - End Time"}
                            </p>
                        </div>
                    </div>
                </div>
                <Button 
                    onClick={handleAddAssignment} 
                    className="mt-4 hover:bg-white hover:text-black"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                        </>
                    ) : (
                        'Add Assignment'
                    )}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
