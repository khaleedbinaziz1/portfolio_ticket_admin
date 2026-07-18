import { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendarAlt } from 'react-icons/fa';

// Shared palette, kept in sync with the sidebar / dashboard.
const STEEL = '#3F6584';

// Coerce every value to Number before summing. If a price field ever comes
// back as a string (as happened with totalCost/total_amount elsewhere in
// this app), `sum + "425.00"` silently produces the string "0425.00"
// instead of the number 425, and every later add just glues on more
// digits. toNumber() prevents that.
const toNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

const RANGE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '1y', label: 'Last 1 Year' },
  { id: 'custom', label: 'Custom' },
];

const Checkin = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Online Tickets'); // Default tab is Online Tickets

  const [rangeMode, setRangeMode] = useState('today');
  const [customRange, setCustomRange] = useState([null, null]);
  const [customStart, customEnd] = customRange;

  const formatDate = (date) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Dhaka' };
    return new Intl.DateTimeFormat('en-CA', options).format(date);
  };

  // Resolve whichever preset (or custom picker selection) is active into
  // concrete start/end Date objects, plus a label for the header.
  const { rangeStartDate, rangeEndDate, rangeLabel } = useMemo(() => {
    const today = new Date();

    const withOffset = (days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d;
    };

    if (rangeMode === 'today') {
      return { rangeStartDate: today, rangeEndDate: today, rangeLabel: `Today (${formatDate(today)})` };
    }
    if (rangeMode === '7d') {
      const start = withOffset(-6);
      return { rangeStartDate: start, rangeEndDate: today, rangeLabel: `${formatDate(start)} → ${formatDate(today)}` };
    }
    if (rangeMode === '30d') {
      const start = withOffset(-29);
      return { rangeStartDate: start, rangeEndDate: today, rangeLabel: `${formatDate(start)} → ${formatDate(today)}` };
    }
    if (rangeMode === '1y') {
      const start = withOffset(-364);
      return { rangeStartDate: start, rangeEndDate: today, rangeLabel: `${formatDate(start)} → ${formatDate(today)}` };
    }
    // custom
    const start = customStart || today;
    const end = customEnd || customStart || today;
    return { rangeStartDate: start, rangeEndDate: end, rangeLabel: `${formatDate(start)} → ${formatDate(end)}` };
  }, [rangeMode, customStart, customEnd]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint =
          activeTab === 'Online Tickets'
            ? 'https://portfolio-ticket-server.vercel.app/onlineBooking'
            : 'https://portfolio-ticket-server.vercel.app/bookedtickets';

        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        const startStr = formatDate(rangeStartDate);
        const endStr = formatDate(rangeEndDate);

        const filteredData = result.filter((item) => {
          const dateField =
            activeTab === 'Online Tickets' ? item.checked_in_time : item.date;
          const formattedItemDate = dateField ? dateField.split('T')[0] : null;

          return (
            formattedItemDate &&
            formattedItemDate >= startStr &&
            formattedItemDate <= endStr &&
            item.ticket_status === 'Checked-In'
          );
        });

        setData(filteredData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [rangeStartDate, rangeEndDate, activeTab]);

  const calculateCounts = (location) => {
    const locationData = data.filter((item) => {
      const fromLocation =
        activeTab === 'Online Tickets' ? item.desc?.from : item.fromLocation;
      return fromLocation === location;
    });

    const totalTickets = locationData.length;

    const numberOfAdult = locationData.reduce((sum, item) => {
      const adults =
        activeTab === 'Online Tickets' ? item.desc?.numberOfAdult : item.totalAdultPassengers;
      return sum + toNumber(adults);
    }, 0);

    const numberOfHalfTickets = locationData.reduce((sum, item) => {
      const halfTickets =
        activeTab === 'Online Tickets' ? item.desc?.numberOfHalfTickets : item.totalHalfTicketPassengers;
      return sum + toNumber(halfTickets);
    }, 0);

    const totalWeightPrice = locationData.reduce((sum, item) => {
      const weightPrice = activeTab === 'Online Tickets' ? item.desc?.weightPrice : item.weightPrice;
      return sum + toNumber(weightPrice);
    }, 0);

    const totalTicketPrice = locationData.reduce((sum, item) => {
      const ticketPrice = activeTab === 'Online Tickets' ? item.total_amount : item.totalCost;
      return sum + toNumber(ticketPrice);
    }, 0);

    return { totalTickets, numberOfAdult, numberOfHalfTickets, totalWeightPrice, totalTicketPrice };
  };

  const kumiraCounts = calculateCounts('Kumira');
  const sandwipCounts = calculateCounts('Sandwip');

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#FAFBFC] px-6 py-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2B33]">Check-Ins</h1>
          <p className="text-[13px] text-[#8A97A0] mt-1">{rangeLabel}</p>
        </div>

        {/* Ticket type tabs */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex bg-white border border-[#E4E9EC] rounded-lg p-1">
            <button
              className={`px-5 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                activeTab === 'Online Tickets' ? 'bg-[#3F6584] text-white shadow-sm' : 'text-[#5C6B73] hover:text-[#1F2B33]'
              }`}
              onClick={() => setActiveTab('Online Tickets')}
            >
              Online Tickets
            </button>
            <button
              className={`px-5 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                activeTab === 'Counter Tickets' ? 'bg-[#3F6584] text-white shadow-sm' : 'text-[#5C6B73] hover:text-[#1F2B33]'
              }`}
              onClick={() => setActiveTab('Counter Tickets')}
            >
              Counter Tickets
            </button>
          </div>
        </div>

        {/* Date range picker */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 bg-white border border-[#E4E9EC] rounded-xl p-2 mx-auto w-fit">
          <span className="inline-flex items-center gap-1.5 text-[#5C6B73] text-[12px] font-medium pl-2 pr-1">
            <FaCalendarAlt size={12} />
            Range
          </span>
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setRangeMode(preset.id)}
              className={`px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-colors duration-200 ${
                rangeMode === preset.id ? 'bg-[#3F6584] text-white' : 'text-[#5C6B73] hover:bg-[#3F6584]/10'
              }`}
            >
              {preset.label}
            </button>
          ))}
          {rangeMode === 'custom' && (
            <DatePicker
              selectsRange
              startDate={customStart}
              endDate={customEnd}
              onChange={(update) => setCustomRange(update)}
              dateFormat="yyyy-MM-dd"
              className="text-[13px] border border-[#E4E9EC] rounded-lg px-2 py-1.5 text-[#1F2B33] ml-1"
              placeholderText="Select a date range"
              isClearable
            />
          )}
        </div>

        {loading && <p className="text-center text-lg font-semibold text-[#5C6B73]">Loading...</p>}
        {error && <p className="text-center text-lg font-semibold text-red-600">Error: {error}</p>}

        {!loading && !error && (
          <div className="space-y-6">
            {/* Kumira Section */}
            <div className="p-6 bg-white border border-[#E4E9EC] rounded-xl">
              <h3 className="text-xl font-semibold text-[#3F6584] text-center">
                Kumira <span className="text-[13px] font-normal text-[#8A97A0]">({kumiraCounts.totalTickets} tickets)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                <StatCard title="Number of Adults" value={kumiraCounts.numberOfAdult} />
                <StatCard title="Half Tickets" value={kumiraCounts.numberOfHalfTickets} />
                <StatCard title="Weight Price" value={kumiraCounts.totalWeightPrice.toFixed(0)} />
                <StatCard title="Ticket+Weight Price" value={kumiraCounts.totalTicketPrice.toFixed(0)} tone="money" />
              </div>
            </div>

            {/* Sandwip Section */}
            <div className="p-6 bg-white border border-[#E4E9EC] rounded-xl">
              <h3 className="text-xl font-semibold text-[#D9A441] text-center">
                Sandwip <span className="text-[13px] font-normal text-[#8A97A0]">({sandwipCounts.totalTickets} tickets)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                <StatCard title="Number of Adults" value={sandwipCounts.numberOfAdult} />
                <StatCard title="Half Tickets" value={sandwipCounts.numberOfHalfTickets} />
                <StatCard title="Weight Price" value={sandwipCounts.totalWeightPrice.toFixed(0)} />
                <StatCard title="Ticket+Weight Price" value={sandwipCounts.totalTicketPrice.toFixed(0)} tone="money" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, tone = 'default' }) => (
  <div className="bg-[#FAFBFC] border border-[#E4E9EC] p-4 rounded-lg hover:border-[#3F6584]/40 hover:shadow-[0_4px_16px_rgba(63,101,132,0.1)] transition-all duration-200">
    <h4 className="text-[13px] font-medium text-[#5C6B73] text-center">{title}</h4>
    <p className={`text-2xl font-bold text-center mt-1 ${tone === 'money' ? 'text-[#1F8A50]' : 'text-[#1F2B33]'}`}>
      {value}
    </p>
  </div>
);

export default Checkin;