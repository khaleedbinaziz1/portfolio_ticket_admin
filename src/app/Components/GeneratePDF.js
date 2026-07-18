const generatePDF = () => {
    const doc = new jsPDF();
  
    // Header
    doc.setFontSize(18);
    doc.text("Tickets Booking Report", 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
  
    // Page header with custom logo and date range
    if (startDate && endDate) {
      doc.text(`From ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, 14, 28);
    } else {
      doc.text("All Booked Tickets", 14, 28);
    }
  
    // Filter tickets within the date range
    const filteredForPDF = bookedTickets.filter((ticket) => {
      const ticketDate = new Date(ticket.bookingDate);
      return startDate && endDate
        ? ticketDate >= startDate && ticketDate <= endDate
        : true;
    });
  
    // Define column headers and data
    doc.autoTable({
      startY: 40,
      head: [['Name', 'Destination', 'Date', 'Boat', 'Passengers', 'Phone No', 'Total Cost']],
      body: filteredForPDF.map((ticket) => [
        ticket.name,
        ticket.toLocation,
        new Date(ticket.date).toLocaleDateString(),
        ticket.boatType,
        ticket.totalAdultPassengers ,
        ticket.phoneNo,
        `৳ ${ticket.totalCost}`
      ]),
      theme: 'grid',  // Grid theme for a boxed design
      styles: { fontSize: 10, cellPadding: 4 },  // Adjust text and padding
      headStyles: { fillColor: [0, 57, 107], textColor: 255, fontSize: 11 },  // Header styling
      bodyStyles: { fillColor: [220, 220, 220] },  // Body row alternating color
    });
  
    // Footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
    }
  
    // Save the PDF with a customized filename
    doc.save(`tickets_report_${new Date().toLocaleDateString()}.pdf`);
  };
  