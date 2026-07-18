// TicketsBooked.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import generateCustomPDF from './CustomPDF';
import * as XLSX from 'xlsx';

const OnlineBooking = () => {
  const [bookedTickets, setBookings] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const ticketRef = useRef(); // Reference for the ticket details section

  const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const response = await fetch('https://portfolio-ticket-server.vercel.app/onlineBooking');
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }
        const data = await response.json();
        setBookings(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    fetchBookings();
  }, []);

  useEffect(() => {
    const filtered = bookedTickets.filter(ticket => {
      const matchesSearchTerm = ticket.phoneNo.toString().toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = selectedDate ? new Date(ticket.date).toLocaleDateString() === selectedDate.toLocaleDateString() : true;
      return matchesSearchTerm && matchesDate;
    });
    setFilteredTickets(filtered);
  }, [searchTerm, bookedTickets, selectedDate]);

  const handleGeneratePDF = () => {
    if (!fromDate || !toDate) {
      alert('Please select both the From Date and To Date to generate the PDF.');
      return;
    }
    
    const filteredByDateRange = bookedTickets.filter(ticket => {
      const ticketDate = new Date(ticket.bookingDate).setHours(0, 0, 0, 0); // Normalize date for comparison
      const start = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
      const end = toDate ? new Date(toDate).setHours(0, 0, 0, 0) : null;
      return (!start || ticketDate >= start) && (!end || ticketDate <= end);
    });
  
    generateCustomPDF(filteredByDateRange, fromDate, toDate);
  };

  const handleGenerateExcel = () => {
  if (!fromDate || !toDate) {
    alert('Please select both the From Date and To Date to generate the Excel.');
    return;
  }

  // Filter tickets by the selected date range
  const filteredByDateRange = bookedTickets.filter(ticket => {
    const ticketDate = new Date(ticket.bookingDate).setHours(0, 0, 0, 0); // Normalize date for comparison
    const start = new Date(fromDate).setHours(0, 0, 0, 0);
    const end = new Date(toDate).setHours(0, 0, 0, 0);
    return ticketDate >= start && ticketDate <= end;
  });

  if (filteredByDateRange.length === 0) {
    alert('No tickets available for the selected date range.');
    return;
  }

  // Prepare data for Excel
  const dataToExport = filteredByDateRange.map(ticket => ({
    ID: ticket._id,
    Name: ticket.name,
    PhoneNo: ticket.phoneNo,
    TravelingDate: new Date(ticket.date).toLocaleDateString(),
    ExpiredDate: new Date(new Date(ticket.date).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    TravelingTime: ticket.time,
    BoatType: ticket.boatType,
    AdultCount: ticket.totalAdultPassengers,
    ChildrenCount: ticket.childrenCount,
    BaggageCount: ticket.baggageCount,
    BookingDate: new Date(ticket.bookingDate).toLocaleDateString(),
    FromLocation: ticket.fromLocation,
    ToLocation: ticket.toLocation,
    BookingPlatform: ticket.platform,
    TotalCost: `৳ ${ticket.totalCost}`,
  }));

  // Calculate totals
  const totalAdults = filteredByDateRange.reduce((sum, ticket) => sum + ticket.totalAdultPassengers, 0);
  const totalChildren = filteredByDateRange.reduce((sum, ticket) => sum + ticket.childrenCount, 0);
  const totalCost = filteredByDateRange.reduce((sum, ticket) => sum + ticket.totalCost, 0);

  // Add totals row
  dataToExport.push({
    ID: '',
    Name: 'Total',
    PhoneNo: '',
    TravelingDate: '',
    ExpiredDate: '',
    TravelingTime: '',
    BoatType: '',
    AdultCount: totalAdults,
    ChildrenCount: totalChildren,
    BaggageCount: '',
    BookingDate: '',
    FromLocation: '',
    ToLocation: '',
    BookingPlatform: '',
    TotalCost: `৳ ${totalCost}`,
  });

  // Generate Excel sheet
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  
  // Style the totals row
  const totalsRowIndex = dataToExport.length; // 1-based index of the totals row
  const cellStyle = {
    fill: {
      fgColor: { rgb: 'FFFF00' }, // Yellow background
    },
    font: {
      bold: true,
    },
  };

  // Apply styles to the total row cells (AdultCount, ChildrenCount, TotalCost)
  const adultCell = `H${totalsRowIndex}`;
  const childrenCell = `I${totalsRowIndex}`;
  const costCell = `N${totalsRowIndex}`;

  worksheet[adultCell].s = cellStyle; // Style the "AdultCount" total cell
  worksheet[childrenCell].s = cellStyle; // Style the "ChildrenCount" total cell
  worksheet[costCell].s = cellStyle; // Style the "TotalCost" cell

  // Save the workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');

  // Format the date properly for the file name
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Add leading zero
    const day = String(d.getDate()).padStart(2, '0'); // Add leading zero
    return `${year}-${month}-${day}`;
  };

  // Use the formatted date range for the file name
  const fileName = `Tickets_${formatDate(fromDate)}_to_${formatDate(toDate)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

 

  const handleRowClick = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
  };

  const sortedTickets = filteredTickets
    .slice()
    .sort((a, b) => {
      const dateA = a.editedDate ? new Date(a.editedDate) : new Date(a.bookingDate);
      const dateB = b.editedDate ? new Date(b.editedDate) : new Date(b.bookingDate);
      return dateB - dateA;
    });

  const indexOfLastTicket = currentPage * rowsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - rowsPerPage;
  const currentTickets = sortedTickets.slice(indexOfFirstTicket, indexOfLastTicket);

  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#ffffff]">
      <div className="flex-1 ml-40 p-4">
        <div className="bg-blue rounded-lg p-3">
          <div className="flex flex-col items-center mb-6">
          <h1 className="text-2xl font-bold text-center mb-4" style={{ color: '#561C24' }}>Online Ticket Booking</h1>
          <div className="flex gap-4 mb-6 w-full max-w-md">
            <input
              type="text"
              placeholder="Search by Phone No"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered w-full"
            />
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              className="input input-bordered"
              placeholderText="Select a date"
            />
          </div>
          <div className="flex justify-between items-center mb-4">
  <div className="flex gap-2">
    <DatePicker
      selected={fromDate}
      onChange={(date) => setFromDate(date)}
      className="input input-bordered"
      placeholderText="From Date"
    />
    <DatePicker
      selected={toDate}
      onChange={(date) => setToDate(date)}
      className="input input-bordered"
      placeholderText="To Date"
    />
    <button onClick={handleGeneratePDF} className="btn btn-primary font-semibold">
      Generate PDF
    </button>
    <button onClick={handleGenerateExcel} className="btn btn-success font-semibold">
      Generate Excel
    </button>
  </div>
</div>


          {currentTickets.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <table className="bg-white table w-full text-center border border-gray-300 rounded-lg">
                <thead>
                  <tr>
                    <th>Row No</th>
                    <th>Name</th>
                    <th>Destination</th>
                    <th>Date</th>
                    <th>Boat</th>
                    <th>Passengers</th>
                    <th>Phone No</th>
                    <th>Total Cost</th>
                    <th>Booking Date</th>
                  </tr>
                </thead>
                <tbody>
                    {currentTickets.map((ticket, index) => (
                      <tr
                        key={ticket._id}
                        className="hover cursor-pointer"
                        onClick={() => handleRowClick(ticket)}
                      >
                         <td>{index + 1 + (currentPage - 1) * rowsPerPage}</td>
                        <td className="max-w-xs overflow-hidden text-ellipsis whitespace-normal" style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical"
                        }}>
                          {capitalizeFirstLetter(ticket.name)}
                        </td>
                        <td>{capitalizeFirstLetter(ticket.toLocation)}</td>
                        <td>{new Date(ticket.date).toLocaleDateString()}</td>
                        <td>{capitalizeFirstLetter(ticket.boatType)}</td>
                        <td>{ticket.totalAdultPassengers + ticket.childrenCount}</td>
                        <td>{ticket.phoneNo}</td>
                        <td>৳ {ticket.totalCost}</td>
                        <td>{new Date(ticket.bookingDate).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-center space-x-4 mt-4">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="btn btn-sm"
                  >
                    Previous
                  </button>
                  <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="btn btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
          ) : (
            <p className="text-gray-500 mt-4">No tickets found.</p>
          )}
        </div>
      </div>
    </div>

    {isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70 backdrop-blur-sm transition-all duration-300 ease-out px-4 py-10">
    <div className="bg-white p-3 rounded-lg shadow-2xl transform transition-transform duration-300 scale-95 sm:scale-100 w-full max-w-4xl mx-auto">
      <h2 className="text-2xl md:text-2xl font-semibold mb-3 text-center text-gray-800">Ticket Details</h2>
          <div ref={ticketRef} className="animate-fadeIn overflow-y-auto max-h-[80vh]">
            {selectedTicket && (
            <>
              {/* Employee Data */}
              <div className="bg-gray-200 p-4 rounded-md shadow-md mb-2">
              <h3 className="text-lg md:text-xl font-bold mb-2 text-black">Employee Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 text-black">
                <p><strong>ID:</strong> {selectedTicket._id}</p>
                <p><strong>Booked By:</strong> {selectedTicket.employeeName}</p>
                <p><strong>Booking Date:</strong> {new Date(selectedTicket.bookingDate).toLocalString()}</p>
                <p><strong>Edited By:</strong> {selectedTicket.EditedBYJoe || 'N/A'}</p>
                <p><strong>Edit Date:</strong> {selectedTicket.editedDate || 'N/A'}</p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-200 p-4 rounded-md shadow-md mb-1">
              <h3 className="text-lg md:text-xl font-bold mb-2 text-black">Customer Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 text-black">
                <p><strong>Name:</strong> {selectedTicket.name}</p>
                <p><strong>Phone No:</strong> {selectedTicket.phoneNo}</p>
                <p><strong>Traveling Date:</strong> {new Date(selectedTicket.date).toLocaleDateString()}</p>
                <p><strong>Expired Date:</strong> {new Date(new Date(selectedTicket.date).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                <p><strong>Traveling Time:</strong> {selectedTicket.time}</p>
                <p><strong>Boat Type:</strong> {selectedTicket.boatType}</p>
                <p><strong>Adult Count:</strong> {selectedTicket.totalAdultPassengers}</p>
                <p><strong>Children Count:</strong> {selectedTicket.childrenCount}</p>
                <p><strong>Baggage Count:</strong> {selectedTicket.baggageCount}</p>
                <p><strong>From Location:</strong> {selectedTicket.fromLocation}</p>
                <p><strong>To Location:</strong> {selectedTicket.toLocation}</p>
                <p><strong>Booking Platform:</strong> {selectedTicket.platform}</p>
                <p><strong>Payment Method:</strong> {selectedTicket.paymentMethod}</p>
                <p><strong>Status:</strong> {selectedTicket.ticket_status}</p>
              </div>
            </div>

            {/* Total Cost */}
            <div className="text-center mt-4">
              <p className="text-3xl md:text-xl font-bold text-black">
                Total Cost: <span className="text-[#f03737]">৳ {selectedTicket.totalCost}</span>
              </p>
            </div>
            {/* Ticket Expired Message */}
            <div className="text-center mt-3">
              {new Date() > new Date(new Date(selectedTicket.date).getTime() + 3 * 24 * 60 * 60 * 1000) ? (
                <p className="text-4xl font-bold text-red-600">Ticket Expired</p>
              ) : (
                <p className="text-2xl font-bold text-green-600"></p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Close Button */}
      <div className="mt-2 flex justify-center">
        <button 
          onClick={closeModal} 
          className="px-6 py-2 rounded-lg font-semibold text-white transition-transform transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#f03737]"
          style={{ backgroundColor: '#f03737' }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default OnlineBooking;
