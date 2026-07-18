// OnlineBooking.js
import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import generateCustomOnlinePDF from './GenerateOnlinePDF';
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

const OnlineBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Guarded against null/undefined — some records are missing desc.name,
  // desc.boatType, or ticket_status, and calling .charAt on undefined
  // throws the same class of error as the paymentId crash fixed earlier.
  const capitalizeFirstLetter = (string) =>
    string ? string.charAt(0).toUpperCase() + string.slice(1) : 'N/A';

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

  const [SlocationFilter, setSLocationFilter] = useState("Both");

  useEffect(() => {
    const filtered = bookings.filter(ticket => {
      const matchesSearchTerm = (ticket.cus_phone ?? '')
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesDate = selectedDate
        ? new Date(ticket.pay_time).toLocaleDateString() === selectedDate.toLocaleDateString()
        : true;

      const matchesLocation =
        SlocationFilter === "Both" || ticket.desc?.from === SlocationFilter;

      return matchesSearchTerm && matchesDate && matchesLocation;
    });

    setFilteredTickets(filtered);
  }, [searchTerm, bookings, selectedDate, SlocationFilter]);

  const [locationFilter, setLocationFilter] = useState("Both");

  const handleLocationChange = (event) => {
    setLocationFilter(event.target.value);
  };

  const handleGeneratePDF = () => {
    if (!fromDate || !toDate) {
      alert("Please select both the From Date and To Date to generate the PDF.");
      return;
    }

    const filteredByDateAndLocation = bookings.filter((ticket) => {
      const bookingDate = new Date(ticket.pay_time).setHours(0, 0, 0, 0);
      const editedDate = ticket.editedDate ? new Date(ticket.editedDate).setHours(0, 0, 0, 0) : null;
      const start = new Date(fromDate).setHours(0, 0, 0, 0);
      const end = new Date(toDate).setHours(0, 0, 0, 0);

      const matchesBookingDate = bookingDate >= start && bookingDate <= end;
      const matchesEditedDate = editedDate ? editedDate >= start && editedDate <= end : false;

      const matchesLocation =
        locationFilter === "Both" || (ticket.desc?.from ?? '').toLowerCase() === locationFilter.toLowerCase();

      return (matchesBookingDate || matchesEditedDate) && matchesLocation;
    });

    if (filteredByDateAndLocation.length === 0) {
      alert("No tickets found for the selected date range and location.");
      return;
    }

    generateCustomOnlinePDF(filteredByDateAndLocation, fromDate, toDate, locationFilter);
  };

  const handleGenerateExcel = () => {
    if (!fromDate || !toDate) {
      alert('Please select both the From Date and To Date to generate the Excel.');
      return;
    }

    const filteredByDateRange = bookings.filter(ticket => {
      const ticketDate = new Date(ticket.pay_time).setHours(0, 0, 0, 0);
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
      Name: ticket.desc?.name,
      PhoneNo: ticket.desc?.phone,
      TravelingDate: new Date(ticket.desc?.date).toLocaleDateString(),
      ExpiredDate: new Date(new Date(ticket.desc?.date).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      TravelingTime: ticket.desc?.time,
      BoatType: ticket.desc?.boatType,
      AdultCount: ticket.desc?.numberOfAdult,
      BaggageCount: ticket.desc?.baggageWeight,
      BookingDate: new Date(ticket.pay_time).toLocaleDateString(),
      FromLocation: ticket.desc?.from,
      ToLocation: ticket.desc?.to,
      BookingPlatform: ticket.platform,
      TotalCost: `৳ ${ticket.total_amount}`,
    }));

    const totalAdults = filteredByDateRange.reduce((sum, ticket) => sum + (ticket.desc?.numberOfAdult || 0), 0);
    const totalCost = filteredByDateRange.reduce((sum, ticket) => sum + (ticket.total_amount || 0), 0);

    dataToExport.push({
      ID: '',
      Name: 'Total',
      PhoneNo: '',
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

    const totalsRowIndex = dataToExport.length;
    const cellStyle = {
      fill: {
        fgColor: { rgb: 'FFFF00' },
      },
      font: {
        bold: true,
      },
    };

    const adultCell = `H${totalsRowIndex}`;
    const costCell = `N${totalsRowIndex}`;

    // Guard against the cell not existing on the sheet (e.g. an empty
    // export) before styling it, to avoid a second null-reference crash.
    if (worksheet[adultCell]) worksheet[adultCell].s = cellStyle;
    if (worksheet[costCell]) worksheet[costCell].s = cellStyle;

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
    .sort((a, b) => new Date(b.pay_time) - new Date(a.pay_time));

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
                Online Ticket Booking
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
                  placeholder="Search by Phone No"
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
            {loading ? (
              <p className="text-center text-[#8A97A0] text-[13px] py-10">Loading bookings…</p>
            ) : error ? (
              <p className="text-center text-[#B3423E] text-[13px] py-10">{error}</p>
            ) : currentTickets.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#FAFBFC] text-[#5C6B73] text-[12px] uppercase tracking-wide">
                        <th className="text-left px-4 py-3 font-semibold">Row No</th>
                        <th className="text-left px-4 py-3 font-semibold">Name</th>
                        <th className="text-left px-4 py-3 font-semibold">From</th>
                        <th className="text-left px-4 py-3 font-semibold">To</th>
                        <th className="text-left px-4 py-3 font-semibold">Date</th>
                        <th className="text-left px-4 py-3 font-semibold">Boat</th>
                        <th className="text-left px-4 py-3 font-semibold">Passengers</th>
                        <th className="text-left px-4 py-3 font-semibold">Phone No</th>
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
                          <td className="px-4 py-3 font-semibold text-[#1F2B33]">{capitalizeFirstLetter(ticket.desc?.name)}</td>
                          <td className="px-4 py-3 text-[#5C6B73]">{ticket.desc?.from}</td>
                          <td className="px-4 py-3 text-[#5C6B73]">{ticket.desc?.to}</td>
                          <td className="px-4 py-3 text-[#5C6B73]">{ticket.desc?.date}</td>
                          <td className="px-4 py-3 text-[#5C6B73]">{capitalizeFirstLetter(ticket.desc?.boatType)}</td>
                          <td className="px-4 py-3 text-[#5C6B73]">
                            {(ticket.desc?.numberOfAdult || 0) +
                              (ticket.desc?.numberOfHalfTickets || 0)}
                          </td>
                          <td className="px-4 py-3 text-[#5C6B73]">{ticket.desc?.phone}</td>
                          <td className="px-4 py-3 font-semibold text-[#1F8A50]">৳ {ticket.total_amount}</td>
                          <td className="px-4 py-3 text-[#5C6B73]">
                            {new Date(ticket.pay_time).toLocaleDateString()}
                            <br />
                            <span className="text-[12px] text-[#8A97A0]">{new Date(ticket.pay_time).toLocaleTimeString()}</span>
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
              <h2 className="text-lg font-bold text-[#1F2B33]">Online Ticket Details</h2>
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
                    <h3 className="text-[13px] font-semibold text-[#5C6B73] uppercase tracking-wide mb-3">Employee Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[#1F2B33] text-sm">
                      <p><span className="text-[#8A97A0]">ID:</span> {selectedTicket._id}</p>
                      <p><span className="text-[#8A97A0]">Booking Date &amp; Time:</span> {new Date(selectedTicket.pay_time).toLocaleString()}</p>
                      <p><span className="text-[#8A97A0]">Edited By:</span> {selectedTicket.EditedBYJoe || 'N/A'}</p>
                      <p><span className="text-[#8A97A0]">Edit Date:</span> {selectedTicket.editedDate || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="bg-[#FAFBFC] border border-[#E4E9EC] p-4 rounded-lg mb-4">
                    <h3 className="text-[13px] font-semibold text-[#5C6B73] uppercase tracking-wide mb-3">Customer Info</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[#1F2B33] text-sm">
                      <p><span className="text-[#8A97A0]">Name:</span> {selectedTicket.desc?.name}</p>
                      <p><span className="text-[#8A97A0]">Phone No:</span> {selectedTicket.desc?.phone}</p>
                      <p><span className="text-[#8A97A0]">Traveling Date:</span> {selectedTicket.desc?.date ? new Date(selectedTicket.desc.date).toLocaleDateString() : 'N/A'}</p>
                      <p><span className="text-[#8A97A0]">Expired Date:</span> {selectedTicket.desc?.date ? new Date(new Date(selectedTicket.desc.date).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'N/A'}</p>
                      <p><span className="text-[#8A97A0]">Traveling Time:</span> {selectedTicket.desc?.time}</p>
                      <p><span className="text-[#8A97A0]">Boat Type:</span> {selectedTicket.desc?.boatType}</p>
                      <p><span className="text-[#8A97A0]">Passengers:</span> {selectedTicket.desc?.numberOfAdult}</p>
                      {selectedTicket.desc?.boatType === "speedBoat" && (
                        <p><span className="text-[#8A97A0]">Half-Tickets:</span> {selectedTicket.desc?.numberOfHalfTickets || 0}</p>
                      )}
                      <p><span className="text-[#8A97A0]">Baggage Count:</span> {selectedTicket.desc?.baggageWeight}</p>
                      <p><span className="text-[#8A97A0]">From Location:</span> {selectedTicket.desc?.from}</p>
                      <p><span className="text-[#8A97A0]">To Location:</span> {selectedTicket.desc?.to}</p>
                      <p><span className="text-[#8A97A0]">Booking Platform:</span> {selectedTicket.platform}</p>
                      <p><span className="text-[#8A97A0]">Payment Method:</span> {selectedTicket.card_type}</p>
                      <p><span className="text-[#8A97A0]">Payment ID:</span> {selectedTicket.paymentId ?? 'N/A'}</p>
                      <p><span className="text-[#8A97A0]">Status:</span> {capitalizeFirstLetter(selectedTicket.ticket_status)}</p>
                      <p><span className="text-[#8A97A0]">Refund Amount:</span> {selectedTicket.afterRefund || 'N/A'}</p>
                      <p><span className="text-[#8A97A0]">Refund Reason:</span> {selectedTicket.refundReason || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xl font-bold text-[#1F2B33]">
                      Total Cost: <span className="text-[#1F8A50]">৳ {selectedTicket.total_amount}</span>
                    </p>
                  </div>

                  {selectedTicket.desc?.date && new Date() > new Date(new Date(selectedTicket.desc.date).getTime() + 3 * 24 * 60 * 60 * 1000) && (
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

export default OnlineBooking;