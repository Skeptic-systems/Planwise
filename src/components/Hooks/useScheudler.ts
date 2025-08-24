import { useState } from "react";
import type {EmployeeAssignment} from "@/components/types/types.ts";

export const PASTEL_COLORS = ["bg-pink-200", "bg-blue-200", "bg-green-200", "bg-yellow-200", "bg-purple-200"];

export const useScheduler = () => {
    const [fields, setFields] = useState<string[]>([]);
    const [assignments, setAssignments] = useState<EmployeeAssignment[]>([]);

    const addField = (field: string) => {
        setFields((prev) => [...prev, field]);
    };

    const removeField = (field: string) => {
        setFields((prev) => prev.filter((f) => f !== field));
    };

    const addAssignment = (assignment: EmployeeAssignment) => {
        setAssignments((prev) => [...prev, assignment]);
    };

    const removeAssignment = (id: string) => {
        setAssignments((prev) => prev.filter((a) => a.id !== id));
    };

    const updateAssignment = (id: string, updatedAssignment: EmployeeAssignment) => {
        setAssignments((prev) =>
            prev.map((a) => (a.id === id ? updatedAssignment : a))
        );
    };

    return {
        fields,
        assignments,
        addField,
        removeField,
        addAssignment,
        removeAssignment,
        updateAssignment,
    };
};