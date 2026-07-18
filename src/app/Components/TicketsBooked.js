// TicketsBooked.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import generateCustomPDF from './CustomPDF';
import * as XLSX from 'xlsx';
import {
  FaTicketAlt,
  FaSearch,
  FaFilePdf,
  FaFileExcel,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from 'react-icons/fa';

const STEEL = '#3F6584';

const TicketsBooked = ({ username }) => {
  const [bookedTickets, setBookedTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const ticketRef = useRef();

  useEffect(() => {
    const fetchBookedTickets = async () => {
      try {
        const response = await axios.get('https://portfolio-ticket-server.vercel.app/bookedtickets');
        setBookedTickets(response.data);
        setFilteredTickets(response.data);
      } catch (error) {
        console.error('Error fetching booked tickets:', error);
      }
    };
    fetchBookedTickets();
  }, []);

  const [SlocationFilter, setSLocationFilter] = useState("Both");

  useEffect(() => {
    const filtered = bookedTickets.filter(ticket => {
      // paymentId (and other fields below) can be missing/null on some
      // records, so every field read here is guarded before calling
      // string methods on it — this is what was throwing the runtime error.
      const matchesSearchTerm = (ticket.paymentId ?? '')
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesDate = selectedDate ? new Date(ticket.bookingDate).toLocaleDateString() === selectedDate.toLocaleDateString() : true;

      const matchesLocation =
        SlocationFilter === "Both" || ticket.fromLocation === SlocationFilter;
      return matchesSearchTerm && matchesDate && matchesLocation;
    });
    setFilteredTickets(filtered);
  }, [searchTerm, bookedTickets, selectedDate, SlocationFilter]);

  const [locationFilter, setLocationFilter] = useState("Both");

  const handleLocationChange = (event) => {
    setLocationFilter(event.target.value);
  };

  const handleGeneratePDF = () => {
    if (!fromDate || !toDate) {
      alert("Please select both the From Date and To Date to generate the PDF.");
      return;
    }

    const filteredByDateAndLocation = bookedTickets.filter((ticket) => {
      const bookingDate = new Date(ticket.bookingDate).setHours(0, 0, 0, 0);
      const editedDate = ticket.editedDate ? new Date(ticket.editedDate).setHours(0, 0, 0, 0) : null;
      const start = new Date(fromDate).setHours(0, 0, 0, 0);
      const end = new Date(toDate).setHours(0, 0, 0, 0);

      const matchesBookingDate = bookingDate >= start && bookingDate <= end;
      const matchesEditedDate = editedDate ? editedDate >= start && editedDate <= end : false;

      const matchesLocation =
        locationFilter === "Both" || (ticket.fromLocation ?? '').toLowerCase() === locationFilter.toLowerCase();

      return (matchesBookingDate || matchesEditedDate) && matchesLocation;
    });

    if (filteredByDateAndLocation.length === 0) {
      alert("No tickets found for the selected date range and location.");
      return;
    }

    generateCustomPDF(filteredByDateAndLocation, fromDate, toDate, locationFilter);
  };

  const handleGenerateExcel = () => {
    if (!fromDate || !toDate) {
      alert('Please select both the From Date and To Date to generate the Excel.');
      return;
    }

    const filteredByDateRange = bookedTickets.filter(ticket => {
      const ticketDate = new Date(ticket.bookingDate).setHours(0, 0, 0, 0);
      const start = new Date(fromDate).setHours(0, 0, 0, 0);
      const end = new Date(toDate).setHours(0, 0, 0, 0);
      return ticketDate >= start && ticketDate <= end;
    });

    if (filteredByDateRange.length === 0) {
      alert('No tickets available for the selected date range.');
      return;
    }

    const dataToExport = filteredByDateRange.map(ticket => ({
      ID: ticket._id,
      PaymentID: ticket.paymentId,
      TravelingDate: new Date(ticket.date).toLocaleDateString(),
      ExpiredDate: new Date(new Date(ticket.date).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      TravelingTime: ticket.time,
      BoatType: ticket.boatType,
      AdultCount: ticket.totalAdultPassengers,
      BaggageCount: ticket.baggageCount,
      BookingDate: new Date(ticket.bookingDate).toLocaleDateString(),
      FromLocation: ticket.fromLocation,
      ToLocation: ticket.toLocation,
      BookingPlatform: ticket.platform,
      TotalCost: `৳ ${ticket.totalCost}`,
    }));

    const totalAdults = filteredByDateRange.reduce((sum, ticket) => sum + ticket.totalAdultPassengers, 0);
    const totalCost = filteredByDateRange.reduce((sum, ticket) => sum + ticket.totalCost, 0);

    dataToExport.push({
      ID: '',
      PaymentID: '',
      TravelingDate: '',
      ExpiredDate: '',
      TravelingTime: '',
      BoatType: '',
      AdultCount: totalAdults,
      BaggageCount: '',
      BookingDate: '',
      FromLocation: '',
      ToLocation: '',
      BookingPlatform: '',
      TotalCost: `৳ ${totalCost}`,
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');

    const formatDate = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

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
    .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

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

  const inputClass =
    "border border-[#E4E9EC] rounded-lg px-3 py-2.5 text-[#1F2B33] text-sm focus:outline-none focus:border-[#3F6584]/50 focus:ring-2 focus:ring-[#3F6584]/10";

  return (
    <>
      <div className="flex min-h-screen bg-[#FAFBFC]">
        <div className="flex-1 md:ml-52 p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-[#3F6584]/10 text-[#3F6584]">
              <FaTicketAlt size={16} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1F2B33] tracking-tight">
                Counter Ticket Booking
              </h1>
              <p className="text-[13px] text-[#8A97A0]">{filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>

          {/* Filters card */}
          <div className="bg-white border border-[#E4E9EC] rounded-xl p-4 mb-4">
            <h3 className="text-[13px] font-semibold text-[#5C6B73] uppercase tracking-wide mb-3">
              Search &amp; Filter
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A97A0]" size={12} />
                <input
                  type="text"
                  placeholder="Search by Payment ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClass} pl-8 w-56`}
                />
              </div>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                className={inputClass}
                placeholderText="Select a date"
              />
              <select
                value={SlocationFilter}
                onChange={(e) => setSLocationFilter(e.target.value)}
                className={inputClass}
              >
                <option value="Both">Both</option>
                <option value="Kumira">Kumira</option>
                <option value="Sandwip">Sandwip</option>
              </select>
            </div>

            <div className="h-px bg-[#EEF1F3] my-4" />

            <div className="flex flex-wrap items-center gap-3">
              <DatePicker
                selected={fromDate}
                onChange={(date) => setFromDate(date)}
                className={inputClass}
                placeholderText="From Date"
              />
              <DatePicker
                selected={toDate}
                onChange={(date) => setToDate(date)}
                className={inputClass}
                placeholderText="To Date"
              />
              <select
                value={locationFilter}
                onChange={handleLocationChange}
                className={inputClass}
              >
                <option value="Both">Both</option>
                <option value="Kumira">Kumira</option>
                <option value="Sandwip">Sandwip</option>
              </select>
              <button
                onClick={handleGeneratePDF}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#3F6584] hover:bg-[#345368] rounded-lg transition-colors duration-200 shadow-sm"
              >
                <FaFilePdf size={13} />
                Generate PDF
              </button>
              <button
                onClick={handleGenerateExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1F8A50] hover:bg-[#186B3E] rounded-lg transition-colors duration-200 shadow-sm"
              >
                <FaFileExcel size={13} />
                Generate Excel
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#E4E9EC] rounded-xl overflow-hidden">
            {currentTickets.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#FAFBFC] text-[#5C6B73] text-[12px] uppercase tracking-wide">
                        <th className="text-left px-4 py-3 font-semibold">Row No</th>
                        <th className="text-left px-4 py-3 font-semibold">From</th>
                        <th className="text-left px-4 py-3 font-semibold">To</th>
                        <th className="text-left px-4 py-3 font-semibold">Date</th>
                        <th className="text-left px-4 py-3 font-semibold">Boat</th>
                        <th className="text-left px-4 py-3 font-semibold">Passengers</th>
                        <th className="text-left px-4 py-3 font-semibold">Payment ID</th>
                        <th className="text-left px-4 py-3 font-semibold">Total Cost</th>
                        <th className="text-left px-4 py-3 font-semibold">Booking Date</th>
                        <th className="text-left px-4 py-3 font-semibold">Refund</th>
                        <th className="text-left px-4 py-3 font-semibold">Edited</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTickets.map((ticket, index) => (
                        <tr
                          key={ticket._id}
                          className="border-t border-[#EEF1F3] hover:bg-[#3F6584]/5 cursor-pointer transition-colors duration-150"
                          onClick={() => handleRowClick(ticket)}
                        >
                          <td className="px-4 py-3 text-[#8A97A0]">{index + 1 + (currentPage - 1) * rowsPerPage}</td>
                          <td className="px-4 py-3 font-semibold text-[#1F2B33]">{ticket.fromLocation}</td>
                          <td className="px-4 py-3 text-[#5C6B73]">{ticket.toLocation}</td>
                          <td className="px-4 py-3 text-[#5C6B73]">{new Date(ticket.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-[#5C6B73]">{ticket.boatType}</td>
                          <td className="px-4 py-3 text-[#5C6B73]">
                            {ticket.totalAdultPassengers +
                              (ticket.totalHalfTicketPassengers || 0)}
                          </td>
                          <td className="px-4 py-3 text-[#5C6B73]">{ticket.paymentId ?? 'N/A'}</td>
                          <td className="px-4 py-3 font-semibold text-[#1F8A50]">৳ {ticket.totalCost}</td>
                          <td className="px-4 py-3 text-[#5C6B73]">
                            {new Date(ticket.bookingDate).toLocaleDateString()}
                            <br />
                            <span className="text-[12px] text-[#8A97A0]">{new Date(ticket.bookingDate).toLocaleTimeString()}</span>
                          </td>
                          <td className="px-4 py-3 text-[#5C6B73]">৳ {ticket.afterRefund || 'N/A'}</td>
                          <td className="px-4 py-3 text-[#5C6B73]">
                            {ticket.editedDate
                              ? <>
                                  {new Date(ticket.editedDate).toLocaleDateString()}
                                  <br />
                                  <span className="text-[12px] text-[#8A97A0]">{new Date(ticket.editedDate).toLocaleTimeString()}</span>
                                </>
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-center items-center gap-4 p-4 border-t border-[#EEF1F3]">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md border border-[#E4E9EC] text-[#5C6B73] hover:bg-[#3F6584]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                  >
                    <FaChevronLeft size={11} />
                    Previous
                  </button>
                  <span className="text-[13px] text-[#5C6B73]">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md border border-[#E4E9EC] text-[#5C6B73] hover:bg-[#3F6584]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                  >
                    Next
                    <FaChevronRight size={11} />
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-[#8A97A0] text-[13px] py-10">No tickets found.</p>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-[#1F2B33]/60 backdrop-blur-sm px-4 py-10">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E9EC]">
              <h2 className="text-lg font-bold text-[#1F2B33]">Counter Ticket Details</h2>
              <button
                onClick={closeModal}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[#8A97A0] hover:bg-[#EEF1F3] hover:text-[#1F2B33] transition-colors duration-150"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div ref={ticketRef} className="overflow-y-auto max-h-[75vh] p-5">
              {selectedTicket && (
                <>
                  <div className="bg-[#FAFBFC] border border-[#E4E9EC] p-4 rounded-lg mb-3">
                    <h3 className="text-[13px] font-semibold text-[#5C6B73] uppercase tracking-wide mb-3">Employee Data</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[#1F2B33] text-sm">
                      <p><span className="text-[#8A97A0]">ID:</span> {selectedTicket._id}</p>
                      <p><span className="text-[#8A97A0]">Booked By:</span> {selectedTicket.employeeName}</p>
                      <p><span className="text-[#8A97A0]">Booking Date:</span> {new Date(selectedTicket.bookingDate).toLocaleString()}</p>
                      <p><span className="text-[#8A97A0]">Edited By:</span> {selectedTicket.EditedBYJoe || 'N/A'}</p>
                      <p><span className="text-[#8A97A0]">Edit Date:</span> {selectedTicket.editedDate || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="bg-[#FAFBFC] border border-[#E4E9EC] p-4 rounded-lg mb-4">
                    <h3 className="text-[13px] font-semibold text-[#5C6B73] uppercase tracking-wide mb-3">Customer Info</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[#1F2B33] text-sm">
                      <p><span className="text-[#8A97A0]">Payment ID:</span> {selectedTicket.paymentId ?? 'N/A'}</p>
                      <p><span className="text-[#8A97A0]">Traveling Date:</span> {new Date(selectedTicket.date).toLocaleDateString()}</p>
                      <p><span className="text-[#8A97A0]">Expired Date:</span> {new Date(new Date(selectedTicket.date).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                      <p><span className="text-[#8A97A0]">Traveling Time:</span> {selectedTicket.time}</p>
                      <p><span className="text-[#8A97A0]">Boat Type:</span> {selectedTicket.boatType}</p>
                      <p><span className="text-[#8A97A0]">Passengers:</span> {selectedTicket.totalAdultPassengers}</p>
                      {selectedTicket.boatType === "speedBoat" && (
                        <p><span className="text-[#8A97A0]">Half-Tickets:</span> {selectedTicket.totalHalfTicketPassengers || 0}</p>
                      )}
                      <p><span className="text-[#8A97A0]">Baggage Count:</span> {selectedTicket.baggageCount}</p>
                      <p><span className="text-[#8A97A0]">From Location:</span> {selectedTicket.fromLocation}</p>
                      <p><span className="text-[#8A97A0]">To Location:</span> {selectedTicket.toLocation}</p>
                      <p><span className="text-[#8A97A0]">Booking Platform:</span> {selectedTicket.platform}</p>
                      <p><span className="text-[#8A97A0]">Payment Method:</span> {selectedTicket.paymentMethod}</p>
                      <p><span className="text-[#8A97A0]">Status:</span> {selectedTicket.ticket_status}</p>
                      <p><span className="text-[#8A97A0]">Refund Amount:</span> {selectedTicket.afterRefund || 'N/A'}</p>
                      <p><span className="text-[#8A97A0]">Refund Reason:</span> {selectedTicket.refundReason || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xl font-bold text-[#1F2B33]">
                      Total Cost: <span className="text-[#1F8A50]">৳ {selectedTicket.totalCost}</span>
                    </p>
                  </div>

                  {new Date() > new Date(new Date(selectedTicket.date).getTime() + 3 * 24 * 60 * 60 * 1000) && (
                    <div className="text-center mt-3">
                      <p className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-[#B3423E]/10 text-[#B3423E]">
                        Ticket Expired
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-center px-5 py-4 border-t border-[#E4E9EC]">
              <button
                onClick={closeModal}
                className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-[#B3423E] hover:bg-[#95322E] transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TicketsBooked;