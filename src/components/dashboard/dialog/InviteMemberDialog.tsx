import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/overlays/dialog";
import { Button } from "@/components/ui/elements/button";
import { Input } from "@/components/ui/elements/input";
import { Label } from "@/components/ui/elements/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';

interface Plan {
    id: string;
    title: string;
}

interface InviteMemberDialogProps {
    plan: Plan;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({ plan, open, onOpenChange }: InviteMemberDialogProps) {
    const [email, setEmail] = React.useState('');
    const [role, setRole] = React.useState('member');
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            // First, check if the user exists
            const { data: users, error: userError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .single();

            if (userError) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "User not found with this email",
                });
                return;
            }

            // Add the user to plan_members
            const { error: memberError } = await supabase
                .from('plan_members')
                .insert({
                    plan_id: plan.id,
                    user_id: users.id,
                    role: role,
                });

            if (memberError) throw memberError;

            toast({
                title: "Success",
                description: "Team member invited successfully",
            });

            onOpenChange(false);
            setEmail('');
            setRole('member');
        } catch (error: any) {
            console.error('Error inviting member:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to invite team member",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Invite a team member to collaborate on "{plan.title}"
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            Send Invite
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
} 