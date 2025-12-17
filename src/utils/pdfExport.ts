import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  filename?: string;
  scale?: number;
  margin?: number;
}

/**
 * Export HTML element to PDF
 */
export async function exportToPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = 'documento.pdf',
    scale = 2,
    margin = 10
  } = options;

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210 - (margin * 2); // A4 width minus margins
    const pageHeight = 295; // A4 height
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = margin;

    // Add first page
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - (margin * 2);

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - (margin * 2);
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Falha ao gerar PDF');
  }
}

/**
 * Generate PDF from HTML string
 */
export async function generatePDFFromHTML(
  htmlContent: string,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const {
    scale = 2
  } = options;

  // Create temporary container
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm'; // A4 width
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;
    const pageHeight = 295;
    let heightLeft = imgHeight;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  } catch (error) {
    document.body.removeChild(container);
    throw error;
  }
}
