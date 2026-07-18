// CustomOnlinePDF.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const generateCustomOnlinePDF = (tickets, fromDate, toDate, locationFilter) => {
  const doc = new jsPDF();

  // Add the logo
  const logoPath = '/kumira-ghat.png'; // Path to the image in the public folder
  doc.addImage(logoPath, 'PNG', 30, 5, 25, 25);

  // Title and Date Range
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("Kumira Guptachara Online Report", 105, 15, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text(`Date Range: ${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`, 105, 25, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text(`Station: ${locationFilter}`, 105, 30, { align: "center" });

  // Convert fromDate and toDate to Date objects at 00:00:00 for precise comparison
  const startDate = new Date(fromDate.setHours(0, 0, 0, 0));
  const endDate = new Date(toDate.setHours(23, 59, 59, 999));

  // Filter tickets for bookings and refunds
  const bookingData = tickets.filter(ticket => {
    const bookingDate = new Date(ticket.pay_time);
    return bookingDate >= startDate && bookingDate <= endDate;
  });

  const refundData = tickets.filter(ticket => {
    const editedDate = new Date(ticket.editedDate);
    return editedDate >= startDate && editedDate <= endDate;
  });

  // Bookings Table
  const bookingColumns = ["No", "Name", "Phone No", "Booking Date", "Boat Type", "Pass", "Half", "Weight", "Cost"];
  const bookingRows = [];
  let totalAdultPassengers = 0;
  let totalHalfTicketPassengers = 0;

  bookingData.forEach((ticket, index) => {
    bookingRows.push([
      index + 1,
      ticket.desc?.name || "N/A",
      ticket.desc?.phone || "N/A",
      new Date(ticket.pay_time).toLocaleDateString() || "N/A",
      ticket.desc?.boatType || "N/A",
      ticket.desc?.numberOfAdult || 0,
      ticket.desc?.numberOfHalfTickets || 0,
      ticket.desc?.baggageWeight || 0,
      ticket.total_amount || 0,
    ]);
    totalAdultPassengers += ticket.desc?.numberOfAdult || 0;
    totalHalfTicketPassengers += ticket.desc?.numberOfHalfTickets || 0;
  });

  const totalBookingCost = bookingData.reduce((acc, ticket) => acc + ticket.total_amount, 0);

  doc.autoTable({
    startY: 32,
    head: [bookingColumns],
    body: bookingRows,
    styles: {
      fontSize: 10,
      cellPadding: 1,
      valign: 'middle',
      halign: 'center',
      lineWidth: 0.1,
    },
    theme: 'grid',
    headStyles: {
      fillColor: '#47abbd',
      textColor: [255, 255, 255],
    },
  });

  // Add Total Cost for Bookings
  let currentY = doc.lastAutoTable.finalY + 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Cost (Bookings): ${totalBookingCost.toFixed(2)}`, 14, currentY);

  // Add Total Adult and Half-Ticket Passengers
  currentY += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Adult Passengers: ${totalAdultPassengers}`, 14, currentY);
  currentY += 5;
  doc.text(`Total Half-Ticket Passengers: ${totalHalfTicketPassengers}`, 14, currentY);

  // Add extra space before Refund Table
  currentY += 10;
  currentY += 20; // Additional space before Refund Table starts

  // Refunds Table
  const refundColumns = ["No", "Name", "Phone No", "Refund Date", "Pass", "Refund Amount"];
  const refundRows = refundData.map((ticket, index) => [
    index + 1,
    ticket.desc?.name || "N/A",
    ticket.desc?.phone || "N/A",
    ticket.editedDate
      ? `${new Date(ticket.editedDate).toLocaleDateString()} ${new Date(ticket.editedDate).toLocaleTimeString()}`
      : "N/S",
    (ticket.desc?.numberOfAdult || 0) + (ticket.desc?.numberOfHalfTickets || 0), // Sum of adult and half-ticket passengers
    ticket.afterRefund || 0,
  ]);
  const totalRefundAmount = refundData.reduce((acc, ticket) => acc + (ticket.afterRefund || 0), 0);

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head: [refundColumns],
    body: refundRows,
    styles: {
      fontSize: 10,
      cellPadding: 1,
      valign: 'middle',
      halign: 'center',
      lineWidth: 0.1,
    },
    theme: 'grid',
    headStyles: {
      fillColor: '#47abbd',
      textColor: [255, 255, 255],
    },
  });

  // Add Total Refunds
  currentY = doc.lastAutoTable.finalY + 5;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Refund: ${totalRefundAmount.toFixed(2)}`, 14, currentY);

  // Net Total
  const netTotal = totalBookingCost - totalRefundAmount;
  currentY += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Net Total: ${netTotal.toFixed(2)}`, 14, currentY);

  // Signature Section
  const signatureLineY = currentY + 15;
  doc.setDrawColor(0, 0, 0);
  doc.line(105, signatureLineY, 165, signatureLineY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Approved by Azmaine Adil Chowdhury", 135, signatureLineY + 5, { align: "center" });

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Generated by Kumira Guptachara Ferry System", 105, signatureLineY + 20, { align: "center" });

  // Save the PDF
  doc.save(`Online_Tickets_Report_${fromDate.toLocaleDateString()}-${toDate.toLocaleDateString()}.pdf`);
};

export default generateCustomOnlinePDF;
