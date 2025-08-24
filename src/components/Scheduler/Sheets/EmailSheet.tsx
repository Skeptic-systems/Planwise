import React from "react";
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/overlays/sheet";
import { Button } from "@/components/ui/elements/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/data-display/table";
import { Checkbox } from "@/components/ui/elements/checkbox";
import { Mail } from "lucide-react";
import type { EmployeeAssignment } from "@/components/types/types";

interface EmailSheetProps {
    assignments: EmployeeAssignment[];
    onSendEmails: () => void;
}

export function EmailSheet({ assignments, onSendEmails }: EmailSheetProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="p-2 h-8 w-8 hover:bg-muted bg-transparent border-transparent">
                    <Mail size={28} strokeWidth={2.25} />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[600px] sm:w-[800px]">
                <SheetHeader>
                    <SheetTitle>Employee Emails</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Select</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Field</TableHead>
                                <TableHead>Shift</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignments.map((assignment) => (
                                <TableRow key={assignment.id}>
                                    <TableCell className="font-medium">
                                        <Checkbox />
                                    </TableCell>
                                    <TableCell className="font-medium">{assignment.name}</TableCell>
                                    <TableCell>{assignment.email}</TableCell>
                                    <TableCell>{assignment.field}</TableCell>
                                    <TableCell>
                                        {assignment.startTime} - {assignment.endTime}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button className="primary" onClick={onSendEmails}>
                        Open Mail Service
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
