import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface NavbarProps {
    planTitle: string;
    isSaving?: boolean;
    onSave: () => Promise<void>;
}

export function Navbar({ planTitle, isSaving = false, onSave }: NavbarProps) {
    return (
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 flex">
                    <a href="/dashboard" className="mr-6 flex items-center space-x-2">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="font-medium">Back</span>
                    </a>
                </div>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold">
                        {planTitle}
                    </h1>
                </div>
                <div>
                    <Button 
                        onClick={onSave} 
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </header>
    );
}
