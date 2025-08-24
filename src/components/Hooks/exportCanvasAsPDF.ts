import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ExportOptions {
    backgroundColor?: string;
    fileName?: string;
    scale?: number;
}

export async function exportCanvasAsPDF(options: ExportOptions = {}) {
    const {
        backgroundColor = "#000",
        fileName = "shiftplan.pdf",
        scale = 2
    } = options;

    const canvasElement = document.getElementById("canvas");
    if (!canvasElement) {
        throw new Error("Canvas element not found. Please ensure the canvas has the ID 'canvas'.");
    }

    try {
        // Wait for any pending animations or renders
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get the parent container to include the full schedule
        const container = canvasElement.closest('.container');
        if (!container) {
            throw new Error("Schedule container not found.");
        }

        const canvas = await html2canvas(container as HTMLElement, {
            backgroundColor,
            scale,
            logging: false,
            useCORS: true,
            allowTaint: true,
            width: container.scrollWidth,
            height: container.scrollHeight,
            windowWidth: container.scrollWidth,
            windowHeight: container.scrollHeight,
            scrollX: 0,
            scrollY: 0,
            onclone: (clonedDoc) => {
                // Ensure the cloned element has the correct styles
                const clonedContainer = clonedDoc.querySelector('.container');
                if (clonedContainer) {
                    (clonedContainer as HTMLElement).style.width = 'auto';
                    (clonedContainer as HTMLElement).style.height = 'auto';
                    (clonedContainer as HTMLElement).style.overflow = 'visible';
                }
            }
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdf = new jsPDF({
            orientation: "l", // Landscape orientation for better fit
            unit: "mm",
            format: "a4"
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        const pdfRatio = pdfWidth / pdfHeight;

        let finalWidth = pdfWidth;
        let finalHeight = pdfWidth / ratio;

        if (finalHeight > pdfHeight) {
            finalHeight = pdfHeight;
            finalWidth = pdfHeight * ratio;
        }

        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;

        pdf.addImage(imgData, "JPEG", x, y, finalWidth, finalHeight);
        pdf.save(fileName);

        return true;
    } catch (error) {
        console.error("Error exporting canvas as PDF:", error);
        throw error;
    }
}
