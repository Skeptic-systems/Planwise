import { EmailSheet } from "@/components/Scheduler/Sheets/EmailSheet.tsx";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Columns,
  FileUp,
  Mail,
  MousePointer2,
  Scissors,
  UserPlus,
} from "lucide-react";
import React, { useState } from "react";
import { AddAssignmentDialog } from "../Dialogs/AddAssignmentDialog";
import { AddFieldDialog } from "../Dialogs/AddFieldDialog";
import { ImportExportDialog } from "../Dialogs/ImportExportDialog";

import type { FloatingEditorNavProps } from "@/components/Scheduler/Interfaces/FloatingEditorNavProps";

export type EditorMode = "normal" | "edittime" | "delete";

export function FloatingEditorNav({
  mode,
  onModeChange,
  assignments,
  onSendEmails,
  addAssignment,
  addField,
  fields,
  activePlan,
  setActivePlan,
}: FloatingEditorNavProps) {
  const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-8 inset-x-0 z-50 flex gap-2 p-2 bg-background/80 backdrop-blur-sm rounded-md border shadow-xl w-fit mx-auto"
    >
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(val: EditorMode) => val && onModeChange(val)}
        className="flex gap-1"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="normal"
                className="h-8 w-8 p-0 bg-transparent hover:bg-muted data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <MousePointer2 size={20} />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>Move Assignment</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="edittime"
                className="h-8 w-8 p-0 bg-transparent hover:bg-muted data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <CalendarClock size={20} />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Time</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="delete"
                className="h-8 w-8 p-0 bg-transparent hover:bg-muted data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Scissors size={20} />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Assignment</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ToggleGroup>

      <div className="border-l mx-2 h-8" />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAddFieldDialogOpen(true)}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <Columns size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add Field</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AddFieldDialog
        addField={addField}
        fields={fields}
        planId={activePlan.planId}
        planTabId={activePlan.tabId}
        open={addFieldDialogOpen}
        onOpenChange={setAddFieldDialogOpen}
      />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <AddAssignmentDialog addAssignment={addAssignment} fields={fields} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add Assignment</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="border-l mx-2 h-8" />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <ImportExportDialog activePlan={activePlan} setActivePlan={setActivePlan} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Import/Export</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="border-l mx-2 h-8" />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <EmailSheet assignments={assignments} onSendEmails={onSendEmails} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send Emails</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}
