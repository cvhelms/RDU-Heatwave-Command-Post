
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPdf = (elementId: string, fileName: string) => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found.`);
    alert(`Error: Could not find element with ID ${elementId} to export.`);
    return;
  }

  // Temporarily add a class for styling during PDF capture
  document.body.classList.add('pdf-capture-active');
  const buttonsToHide = input.querySelectorAll('.no-print');
  buttonsToHide.forEach(btn => btn.classList.add('hidden'));


  html2canvas(input, {
    scale: 2, // Higher scale for better quality
    useCORS: true,
    logging: false,
    onclone: (document) => {
      // This is a good place to modify the cloned document if needed
    }
  }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${fileName}.pdf`);

    // Clean up classes after capture
    document.body.classList.remove('pdf-capture-active');
    buttonsToHide.forEach(btn => btn.classList.remove('hidden'));
  }).catch(err => {
    console.error("Error generating PDF:", err);
    alert("An error occurred while generating the PDF. Please try again.");
    // Ensure cleanup happens even on error
    document.body.classList.remove('pdf-capture-active');
    buttonsToHide.forEach(btn => btn.classList.remove('hidden'));
  });
};
