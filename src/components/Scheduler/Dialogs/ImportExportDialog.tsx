import { useState, useEffect } from "react";
import { Button } from "@/components/ui/elements/button";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/overlays/dialog";
import { exportCanvasAsPDF } from "@/components/Hooks/exportCanvasAsPDF";
import type { SchedulerPlan } from "@/components/types/types";

interface ImportExportDialogProps {
    activePlan: SchedulerPlan | undefined;
    setActivePlan: (plan: SchedulerPlan) => void;
}

export function ImportExportDialog({ activePlan, setActivePlan }: ImportExportDialogProps) {
    const [jsonData, setJsonData] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (activePlan) {
            setJsonData(JSON.stringify(activePlan, null, 2));
        }
    }, [activePlan]);

    const handleExportAsPDF = async () => {
        try {
            setIsExporting(true);
            setError(null);
            await exportCanvasAsPDF({
                backgroundColor: "#0000",
                fileName: "shiftplan.pdf",
                scale: 2
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to export PDF");
            console.error("PDF export error:", err);
        } finally {
            setIsExporting(false);
        }
    };

    const handleJSONExport = () => {
        if (!activePlan) {
            alert("Kein aktiver Plan gefunden!");
            return;
        }
        const data = JSON.stringify(activePlan, null, 2);
        setJsonData(data);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "plan.json";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleJSONImport = () => {
        if (!activePlan) {
            alert("Kein aktiver Plan gefunden!");
            return;
        }
        try {
            const imported = JSON.parse(jsonData);
            console.log("Imported object:", imported);

            if (
                typeof imported !== "object" ||
                imported === null ||
                !imported.name ||
                !Array.isArray(imported.fields) ||
                !Array.isArray(imported.assignments)
            ) {
                alert("Das importierte JSON hat nicht das erwartete Format!");
                return;
            }

            const newPlan: SchedulerPlan = {
                ...imported,
                id: activePlan.id,
            };

            setActivePlan(newPlan);
            alert("Plan erfolgreich importiert!");
        } catch (e) {
            console.error("Fehler beim Importieren:", e);
            alert("Ungültiges JSON!");
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="mt-1 h-8 w-25 hover:bg-muted bg-transparent border-transparent">
                    Import/Export
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import / Export</DialogTitle>
                    <DialogDescription>
                        Importiere oder exportiere deinen Plan.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2 mt-2">
                    <Button 
                        className="hover:bg-white hover:text-black"
                        onClick={handleExportAsPDF} 
                        disabled={isExporting}
                    >
                        {isExporting ? "Exporting..." : "Export als PDF"}
                    </Button>
                    {error && (
                        <div className="text-red-500 text-sm mt-1">
                            {error}
                        </div>
                    )}
                    <Button 
                        onClick={handleJSONExport}
                        className="hover:bg-white hover:text-black"
                    >
                        Export als JSON
                        </Button>
                    <textarea
                        className="w-full bg-slate-900 h-40 mt-2 p-2 border rounded text-mono text-gray font-mono"
                        value={jsonData}
                        onChange={(e) => setJsonData(e.target.value)}
                        placeholder="JSON-Daten hier einfügen..."
                    />
                    <Button onClick={handleJSONImport} className="hover:bg-white hover:text-black">Import aus JSON</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
