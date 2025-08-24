import { useDroppable } from "@dnd-kit/core";
import { useAccessibility } from './hooks/useAccessibility';
import type { Session } from '@supabase/supabase-js';

interface DroppableTimeSlotProps {
    id: string;
    top: number;
    height: number;
    planId: string;
    session: Session | null;
}

export function DroppableTimeSlot({ id, top, height, planId, session }: DroppableTimeSlotProps) {
    const { getTimeSlotAriaLabel, getTimeSlotAriaDescribedBy, getTimeSlotAriaDescription } = useAccessibility({ planId });

    const { setNodeRef, isOver } = useDroppable({
        id,
        data: {
            type: 'timeSlot',
            id,
            planId
        }
    });

    const handleDragOver = () => {
        if (isOver) {
            trackEvent({
                name: 'time_slot_hover',
                properties: {
                    timeSlotId: id,
                }
            });
        }
    };

    return (
        <div
            ref={setNodeRef}
            className={`absolute w-full transition-all duration-300 ease-in-out ${
                isOver ? 'bg-blue-500/10 border-blue-500/30' : 'bg-transparent border-transparent'
            }`}
            style={{
                top: `${top}px`,
                height: `${height}px`,
                borderWidth: '1px',
                borderStyle: 'dashed',
                boxShadow: isOver 
                    ? 'inset 0 0 0 2px rgba(59, 130, 246, 0.5), 0 4px 12px -2px rgba(59, 130, 246, 0.2)' 
                    : 'none',
                borderRadius: isOver ? '4px' : '0',
                margin: isOver ? '0 2px' : '0',
                willChange: 'background-color, border-color, box-shadow'
            }}
            onMouseEnter={handleDragOver}
            aria-label={getTimeSlotAriaLabel(id)}
            aria-describedby={getTimeSlotAriaDescribedBy(id)}
        >
            <div id={getTimeSlotAriaDescribedBy(id)} className="sr-only">
                {getTimeSlotAriaDescription(id)}
            </div>
        </div>
    );
}
