import React, { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/elements/button';
import { Input } from '@/components/ui/elements/input';

interface EditableFieldNameProps {
    field: string;
    updateField: (oldName: string, newName: string) => void;
    removeField: (name: string) => void;
}

export function EditableFieldName({ field, updateField, removeField }: EditableFieldNameProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(field);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName && newName !== field) {
            updateField(field, newName);
        }
        setIsEditing(false);
    };

    return (
        <div className="w-40 shrink-0 p-2 border-l border-gray-200 flex items-center justify-between">
            {isEditing ? (
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                    <Input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-8 text-black"
                        autoFocus
                    />
                    <Button type="submit" size="sm" variant="ghost" className='hover:bg-white hover:text-black'>
                        Save
                    </Button>
                </form>
            ) : (
                <>
                    <span className="font-medium">{field}</span>
                    <div className="flex items-center space-x-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setIsEditing(true)}
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeField(field)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
} 