import { SquareChartGantt } from "lucide-react";

interface FieldDialogTriggerProps {
    onClick: () => void;
}

export function FieldDialogTrigger({ onClick }: FieldDialogTriggerProps) {
    return (
        <div 
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick();
                }
            }}
            className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
        >
            <SquareChartGantt className="h-5 w-5" />
        </div>
    );
} 