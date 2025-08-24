import React from 'react';

interface TooltipProps {
    content: string;
    position: { x: number; y: number };
    tooltipRef: React.RefObject<HTMLDivElement | null>;
}

export function Tooltip({ content, position, tooltipRef }: TooltipProps) {
    return (
        <div
            ref={tooltipRef}
            className="absolute z-50 rounded-md bg-gray-900 px-2 py-1 text-sm text-white shadow-lg"
            style={{
                left: position.x,
                top: position.y,
            }}
        >
            {content}
        </div>
    );
} 