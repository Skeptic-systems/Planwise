import type { Session } from "@/lib/types";
import { useDroppable } from "@dnd-kit/core";
import { useCallback, useState } from "react";
import { useAccessibility } from "./hooks/useAccessibility";

interface ClickableTimeSlotProps {
  id: string;
  top: number;
  height: number;
  planId: string;
  session: Session | null;
  fieldName: string;
  startMinutes: number;
  minuteStep: number;
  onDoubleClick: (startMinutes: number) => void;
  isSelected: boolean;
  onSelect: (startMinutes: number) => void;
}

export function ClickableTimeSlot({
  id,
  top,
  height,
  planId,
  session,
  fieldName,
  startMinutes,
  minuteStep,
  onDoubleClick,
  isSelected,
  onSelect,
}: ClickableTimeSlotProps) {
  const { getTimeSlotAriaLabel, getTimeSlotAriaDescribedBy, getTimeSlotAriaDescription } =
    useAccessibility({ planId });

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "timeSlot",
      id,
      planId,
    },
  });

  const [isHovered, setIsHovered] = useState(false);

  // Format time for display
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const startTime = formatTime(startMinutes);
  const endTime = formatTime(startMinutes + minuteStep);

  const handleClick = useCallback(() => {
    onSelect(startMinutes);
  }, [onSelect, startMinutes]);

  const handleDoubleClick = useCallback(() => {
    onDoubleClick(startMinutes);
  }, [onDoubleClick, startMinutes]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  return (
    <div
      ref={setNodeRef}
      className={`
        absolute w-full transition-all duration-200 ease-in-out cursor-pointer
        border-l-2 border-r-2
        ${isOver ? "bg-blue-500/20 border-blue-500/50" : ""}
        ${isSelected ? "bg-blue-400/10 border-blue-400/30" : "border-transparent"}
        ${isHovered && !isSelected && !isOver ? "bg-gray-700/20 border-gray-600/20" : ""}
      `}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        boxShadow: isOver
          ? "inset 0 0 0 2px rgba(59, 130, 246, 0.5), 0 4px 12px -2px rgba(59, 130, 246, 0.2)"
          : isSelected
            ? "inset 0 0 0 1px rgba(96, 165, 250, 0.3)"
            : "none",
        borderRadius: isOver || isSelected ? "4px" : "0",
        margin: isOver || isSelected ? "0 2px" : "0",
        willChange: "background-color, border-color, box-shadow",
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={getTimeSlotAriaLabel(id)}
      aria-describedby={getTimeSlotAriaDescribedBy(id)}
      title={`${startTime} - ${endTime}`}
    >
      {/* Time label - shows only on hover (not on selection) */}
      {isHovered && !isSelected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-gray-900/80 rounded">
            {startTime}
          </span>
        </div>
      )}

      {/* Accessibility */}
      <div id={getTimeSlotAriaDescribedBy(id)} className="sr-only">
        {getTimeSlotAriaDescription(id)} - Click to select, double-click to add assignment
      </div>
    </div>
  );
}
