"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FaTicketAlt,
  FaUsers,
  FaMoneyBillWave,
  FaUndo,
  FaCoins,
  FaAnchor,
  FaCalendarAlt,
} from 'react-icons/fa';

// Shared palette, kept in sync with the sidebar.
const STEEL = '#3F6584';
const AMBER = '#D9A441';

/* ---------------------------------------------------------------------- */
/* Date helpers                                                            */
/* ---------------------------------------------------------------------- */

// Bangladesh date, optionally offset by N days (negative = past).
const getBangladeshDate = (offsetDays = 0) => {
  const now = new Date();
  const bdNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
  bdNow.setDate(bdNow.getDate() + offsetDays);
  const year = bdNow.getFullYear();
  const month = String(bdNow.getMonth() + 1).padStart(2, '0');
  const day = String(bdNow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Both bookingDate/pay_time/editedDate come through as ISO-ish strings
// ("YYYY-MM-DDTHH:mm:ss..."), so a plain string compare on the date part
// is enough to test range membership — no Date parsing needed.
const inRange = (dateStr, start, end) => {
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  return d >= start && d <= end;
};

/* ---------------------------------------------------------------------- */
/* Aggregation helpers — same shape used for counter and online data,      */
/* just with different field accessors, so the logic isn't duplicated.     */
/* ---------------------------------------------------------------------- */

// Coerce every value to Number before adding. The APIs here return money
// fields (totalCost, total_amount, afterRefund) as strings, and
// `0 + "425.00"` in JS produces the string "0425.00" instead of the
// number 425 — every subsequent add then just concatenates another
// string onto the end. That silent string-concatenation bug is what was
// producing the huge digit blobs instead of real totals.
const toNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

const sumBy = (arr, fn) => arr.reduce((total, item) => total + toNumber(fn(item)), 0);

const aggregateBookings = (bookings, { getLocation, getPassengers, getRevenue }) => {
  const kumira = bookings.filter((b) => getLocation(b) === 'Kumira');
  const sandwip = bookings.filter((b) => getLocation(b) === 'Sandwip');
  return {
    totalBookings: bookings.length,
    totalPassengers: sumBy(bookings, getPassengers),
    totalRevenue: sumBy(bookings, getRevenue),
    kumiraCount: kumira.length,
    kumiraPassengers: sumBy(kumira, getPassengers),
    kumiraRevenue: sumBy(kumira, getRevenue),
    sandwipCount: sandwip.length,
    sandwipPassengers: sumBy(sandwip, getPassengers),
    sandwipRevenue: sumBy(sandwip, getRevenue),
  };
};

const aggregateRefunds = (refunds, { getLocation, getRefundAmount }) => {
  const kumira = refunds.filter((b) => getLocation(b) === 'Kumira' && b.ticket_status === 'Refund');
  const sandwip = refunds.filter((b) => getLocation(b) === 'Sandwip' && b.ticket_status === 'Refund');
  const kumiraAmount = sumBy(kumira, getRefundAmount);
  const sandwipAmount = sumBy(sandwip, getRefundAmount);
  return {
    totalRefundCount: kumira.length + sandwip.length,
    kumiraRefundCount: kumira.length,
    kumiraRefundAmount: kumiraAmount,
    sandwipRefundCount: sandwip.length,
    sandwipRefundAmount: sandwipAmount,
    totalRefundAmount: kumiraAmount + sandwipAmount,
  };
};

// Groups bookings by day or by month, sorted chronologically. Per-day
// buckets over a year of data would be ~365 unreadable x-axis ticks, so
// the caller switches to month grouping once the range is long.
const buildTrend = (bookings, { getDate, getPassengers, getRevenue }, granularity = 'day') => {
  const sliceLen = granularity === 'month' ? 7 : 10; // "YYYY-MM" vs "YYYY-MM-DD"
  const byBucket = {};
  bookings.forEach((b) => {
    const key = (getDate(b) || '').slice(0, sliceLen);
    if (!key) return;
    if (!byBucket[key]) byBucket[key] = { date: key, Passengers: 0, Revenue: 0 };
    byBucket[key].Passengers += toNumber(getPassengers(b));
    byBucket[key].Revenue += toNumber(getRevenue(b));
  });
  return Object.values(byBucket).sort((a, b) => a.date.localeCompare(b.date));
};

/* ---------------------------------------------------------------------- */
/* Presentational pieces                                                   */
/* ---------------------------------------------------------------------- */

const StatCard = ({ label, value, icon: Icon, tone = 'default' }) => {
  const valueColor = tone === 'money' ? 'text-[#1F8A50]' : 'text-[#1F2B33]';
  return (
    <div className="group bg-white border border-[#E4E9EC] rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:border-[#3F6584]/40 hover:shadow-[0_4px_20px_rgba(63,101,132,0.12)]">
      <div className="flex items-center gap-2 text-[#5C6B73]">
        {Icon && (
          <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-[#3F6584]/10 text-[#3F6584]">
            <Icon size={13} />
          </span>
        )}
        <h3 className="text-[13px] font-medium">{label}</h3>
      </div>
      <p className={`text-2xl font-bold mt-3 ${valueColor}`}>{value}</p>
    </div>
  );
};

const RouteBarChart = ({ data }) => (
  <div className="bg-white border border-[#E4E9EC] rounded-xl p-4">
    <h3 className="text-[13px] font-semibold text-[#5C6B73] uppercase tracking-wide mb-3">
      Kumira vs Sandwip
    </h3>
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barGap={8}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F3" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#5C6B73', fontSize: 12 }} axisLine={{ stroke: '#E4E9EC' }} />
        <YAxis tick={{ fill: '#5C6B73', fontSize: 12 }} axisLine={{ stroke: '#E4E9EC' }} />
        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E4E9EC', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Passengers" fill={STEEL} radius={[4, 4, 0, 0]} />
        <Bar dataKey="Revenue" fill={AMBER} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const RouteShareChart = ({ data }) => {
  const COLORS = [STEEL, AMBER];
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="bg-white border border-[#E4E9EC] rounded-xl p-4">
      <h3 className="text-[13px] font-semibold text-[#5C6B73] uppercase tracking-wide mb-3">
        Booking Share
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E4E9EC', fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      {total === 0 && <p className="text-center text-[12px] text-[#8A97A0] -mt-4">No bookings in this range</p>}
    </div>
  );
};

const TrendChart = ({ data, rangeLabel }) => (
  <div className="bg-white border border-[#E4E9EC] rounded-xl p-4 lg:col-span-2">
    <h3 className="text-[13px] font-semibold text-[#5C6B73] uppercase tracking-wide mb-3">
      Daily Trend — {rangeLabel}
    </h3>
    {data.length > 1 ? (
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F3" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#5C6B73', fontSize: 11 }} axisLine={{ stroke: '#E4E9EC' }} />
          <YAxis tick={{ fill: '#5C6B73', fontSize: 12 }} axisLine={{ stroke: '#E4E9EC' }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E4E9EC', fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="Passengers" stroke={STEEL} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Revenue" stroke={AMBER} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <p className="text-center text-[13px] text-[#8A97A0] py-16">
        Pick a range longer than one day to see a trend line.
      </p>
    )}
  </div>
);

const RANGE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '1y', label: 'Last 1 Year' },
  { id: 'custom', label: 'Custom' },
];

/* ---------------------------------------------------------------------- */
/* Main component                                                          */
/* ---------------------------------------------------------------------- */

const DashboardHome = () => {
  // Raw data, fetched once. Everything else below is derived from these
  // two arrays via useMemo, so switching the date range never triggers
  // another network request — it's instant.
  const [allTickets, setAllTickets] = useState([]);
  const [allOnlineBookings, setAllOnlineBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('counter');
  const [rangeMode, setRangeMode] = useState('1y');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('https://portfolio-ticket-server.vercel.app/bookedtickets');
        const data = await response.json();
        setAllTickets(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError(err.message);
      }
    };
    fetchTickets();
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('https://portfolio-ticket-server.vercel.app/onlineBooking');
        const data = await response.json();
        setAllOnlineBookings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching online bookings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Resolve the active preset (or custom inputs) into a concrete start/end
  // date string plus a human label for the header and chart title.
  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    const today = getBangladeshDate(0);
    if (rangeMode === 'today') return { rangeStart: today, rangeEnd: today, rangeLabel: `Today (${today})` };
    if (rangeMode === '7d') {
      const start = getBangladeshDate(-6);
      return { rangeStart: start, rangeEnd: today, rangeLabel: `${start} → ${today}` };
    }
    if (rangeMode === '30d') {
      const start = getBangladeshDate(-29);
      return { rangeStart: start, rangeEnd: today, rangeLabel: `${start} → ${today}` };
    }
    if (rangeMode === '1y') {
      const start = getBangladeshDate(-364);
      return { rangeStart: start, rangeEnd: today, rangeLabel: `${start} → ${today}` };
    }
    // custom
    let start = customStart || today;
    let end = customEnd || today;
    if (start > end) [start, end] = [end, start]; // guard against a reversed pick
    return { rangeStart: start, rangeEnd: end, rangeLabel: `${start} → ${end}` };
  }, [rangeMode, customStart, customEnd]);

  const counterFiltered = useMemo(
    () => allTickets.filter((t) => inRange(t.bookingDate, rangeStart, rangeEnd)),
    [allTickets, rangeStart, rangeEnd]
  );
  const onlineFiltered = useMemo(
    () => allOnlineBookings.filter((t) => inRange(t.pay_time, rangeStart, rangeEnd)),
    [allOnlineBookings, rangeStart, rangeEnd]
  );
  const counterRefundsFiltered = useMemo(
    () => allTickets.filter((t) => t.editedDate && inRange(t.editedDate, rangeStart, rangeEnd)),
    [allTickets, rangeStart, rangeEnd]
  );
  const onlineRefundsFiltered = useMemo(
    () => allOnlineBookings.filter((t) => t.editedDate && inRange(t.editedDate, rangeStart, rangeEnd)),
    [allOnlineBookings, rangeStart, rangeEnd]
  );

  const counterStats = useMemo(
    () =>
      aggregateBookings(counterFiltered, {
        getLocation: (b) => b.fromLocation,
        getPassengers: (b) => toNumber(b.totalAdultPassengers) + toNumber(b.totalHalfTicketPassengers),
        getRevenue: (b) => b.totalCost,
      }),
    [counterFiltered]
  );

  const counterRefundStats = useMemo(
    () => aggregateRefunds(counterRefundsFiltered, { getLocation: (b) => b.fromLocation, getRefundAmount: (b) => b.afterRefund }),
    [counterRefundsFiltered]
  );

  const onlineStats = useMemo(
    () =>
      aggregateBookings(onlineFiltered, {
        getLocation: (b) => b.desc?.from,
        getPassengers: (b) => toNumber(b.desc?.numberOfAdult) + toNumber(b.desc?.numberOfHalfTickets),
        getRevenue: (b) => b.total_amount,
      }),
    [onlineFiltered]
  );

  const onlineRefundStats = useMemo(
    () => aggregateRefunds(onlineRefundsFiltered, { getLocation: (b) => b.desc?.from, getRefundAmount: (b) => b.afterRefund }),
    [onlineRefundsFiltered]
  );

  // Beyond ~60 days, per-day buckets make the trend chart an unreadable
  // wall of x-axis ticks, so switch to monthly buckets automatically.
  const trendGranularity = useMemo(() => {
    const spanDays = (new Date(rangeEnd) - new Date(rangeStart)) / 86400000;
    return spanDays > 60 ? 'month' : 'day';
  }, [rangeStart, rangeEnd]);

  const counterTrend = useMemo(
    () =>
      buildTrend(
        counterFiltered,
        {
          getDate: (b) => b.bookingDate,
          getPassengers: (b) => toNumber(b.totalAdultPassengers) + toNumber(b.totalHalfTicketPassengers),
          getRevenue: (b) => b.totalCost,
        },
        trendGranularity
      ),
    [counterFiltered, trendGranularity]
  );

  const onlineTrend = useMemo(
    () =>
      buildTrend(
        onlineFiltered,
        {
          getDate: (b) => b.pay_time,
          getPassengers: (b) => toNumber(b.desc?.numberOfAdult) + toNumber(b.desc?.numberOfHalfTickets),
          getRevenue: (b) => b.total_amount,
        },
        trendGranularity
      ),
    [onlineFiltered, trendGranularity]
  );

  const counterBarData = useMemo(
    () => [
      { name: 'Kumira', Passengers: counterStats.kumiraPassengers, Revenue: counterStats.kumiraRevenue },
      { name: 'Sandwip', Passengers: counterStats.sandwipPassengers, Revenue: counterStats.sandwipRevenue },
    ],
    [counterStats]
  );
  const counterShareData = useMemo(
    () => [
      { name: 'Kumira', value: counterStats.kumiraCount },
      { name: 'Sandwip', value: counterStats.sandwipCount },
    ],
    [counterStats]
  );
  const onlineBarData = useMemo(
    () => [
      { name: 'Kumira', Passengers: onlineStats.kumiraPassengers, Revenue: onlineStats.kumiraRevenue },
      { name: 'Sandwip', Passengers: onlineStats.sandwipPassengers, Revenue: onlineStats.sandwipRevenue },
    ],
    [onlineStats]
  );
  const onlineShareData = useMemo(
    () => [
      { name: 'Kumira', value: onlineStats.kumiraCount },
      { name: 'Sandwip', value: onlineStats.sandwipCount },
    ],
    [onlineStats]
  );

  return (
    <div className="flex min-h-screen bg-[#FAFBFC]">
      <div className="flex-1 md:ml-52 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-[#3F6584]/10 text-[#3F6584]">
              <FaAnchor size={16} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1F2B33] tracking-tight">
                Kumira Guptachara Ferry — Admin Panel
              </h1>
              <p className="text-[13px] text-[#8A97A0]">{rangeLabel}</p>
            </div>
          </div>

          {/* Counter / Online tabs */}
          <div className="inline-flex bg-white border border-[#E4E9EC] rounded-lg p-1 self-start sm:self-auto">
            <button
              className={`px-5 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                activeTab === 'counter' ? 'bg-[#3F6584] text-white shadow-sm' : 'text-[#5C6B73] hover:text-[#1F2B33]'
              }`}
              onClick={() => setActiveTab('counter')}
            >
              Counter Tickets
            </button>
            <button
              className={`px-5 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                activeTab === 'online' ? 'bg-[#3F6584] text-white shadow-sm' : 'text-[#5C6B73] hover:text-[#1F2B33]'
              }`}
              onClick={() => setActiveTab('online')}
            >
              Online Tickets
            </button>
          </div>
        </div>

        {/* Date range picker */}
        <div className="flex flex-wrap items-center gap-2 mb-6 bg-white border border-[#E4E9EC] rounded-xl p-2">
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
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-[13px] border border-[#E4E9EC] rounded-lg px-2 py-1.5 text-[#1F2B33]"
              />
              <span className="text-[#8A97A0] text-[13px]">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-[13px] border border-[#E4E9EC] rounded-lg px-2 py-1.5 text-[#1F2B33]"
              />
            </div>
          )}
        </div>

        {activeTab === 'counter' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
              <StatCard label="Total Bookings" value={counterStats.totalBookings} icon={FaTicketAlt} />
              <StatCard label="Passengers" value={counterStats.totalPassengers} icon={FaUsers} />
              <StatCard label="Total Revenue" value={`৳ ${counterStats.totalRevenue}`} icon={FaMoneyBillWave} tone="money" />
              <StatCard label="Total Refund" value={counterRefundStats.totalRefundCount} icon={FaUndo} />
              <StatCard label="Total Refund Amount" value={`৳ ${counterRefundStats.totalRefundAmount}`} icon={FaCoins} tone="money" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <RouteBarChart data={counterBarData} />
              <RouteShareChart data={counterShareData} />
              <TrendChart data={counterTrend} rangeLabel={rangeLabel} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatCard label="Ticket from Kumira" value={counterStats.kumiraCount} icon={FaTicketAlt} />
              <StatCard label="Passengers (Kumira)" value={counterStats.kumiraPassengers} icon={FaUsers} />
              <StatCard label="Total Revenue (Kumira)" value={`৳ ${counterStats.kumiraRevenue}`} icon={FaMoneyBillWave} tone="money" />
              <StatCard label="No of Refund (Kumira)" value={counterRefundStats.kumiraRefundCount} icon={FaUndo} />
              <StatCard label="Amount Refund (Kumira)" value={`৳ ${counterRefundStats.kumiraRefundAmount}`} icon={FaCoins} tone="money" />

              <StatCard label="Ticket from Sandwip" value={counterStats.sandwipCount} icon={FaTicketAlt} />
              <StatCard label="Passengers (Sandwip)" value={counterStats.sandwipPassengers} icon={FaUsers} />
              <StatCard label="Total Revenue (Sandwip)" value={`৳ ${counterStats.sandwipRevenue}`} icon={FaMoneyBillWave} tone="money" />
              <StatCard label="No Of Refund (Sandwip)" value={counterRefundStats.sandwipRefundCount} icon={FaUndo} />
              <StatCard label="Amount Refund (Sandwip)" value={`৳ ${counterRefundStats.sandwipRefundAmount}`} icon={FaCoins} tone="money" />
            </div>
          </>
        )}

        {activeTab === 'online' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
              <StatCard label="Total Bookings" value={onlineStats.totalBookings} icon={FaTicketAlt} />
              <StatCard label="Passengers" value={onlineStats.totalPassengers} icon={FaUsers} />
              <StatCard label="Total Revenue" value={`৳ ${onlineStats.totalRevenue}`} icon={FaMoneyBillWave} tone="money" />
              <StatCard label="Total Refund" value={onlineRefundStats.totalRefundCount} icon={FaUndo} />
              <StatCard label="Total Refund Amount" value={`৳ ${onlineRefundStats.totalRefundAmount}`} icon={FaCoins} tone="money" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <RouteBarChart data={onlineBarData} />
              <RouteShareChart data={onlineShareData} />
              <TrendChart data={onlineTrend} rangeLabel={rangeLabel} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatCard label="Ticket from Kumira" value={onlineStats.kumiraCount} icon={FaTicketAlt} />
              <StatCard label="Passengers (Kumira)" value={onlineStats.kumiraPassengers} icon={FaUsers} />
              <StatCard label="Total Revenue (Kumira)" value={`৳ ${onlineStats.kumiraRevenue}`} icon={FaMoneyBillWave} tone="money" />
              <StatCard label="No of Refund (Kumira)" value={onlineRefundStats.kumiraRefundCount} icon={FaUndo} />
              <StatCard label="Amount Refund (Kumira)" value={`৳ ${onlineRefundStats.kumiraRefundAmount}`} icon={FaCoins} tone="money" />

              <StatCard label="Ticket from Sandwip" value={onlineStats.sandwipCount} icon={FaTicketAlt} />
              <StatCard label="Passengers (Sandwip)" value={onlineStats.sandwipPassengers} icon={FaUsers} />
              <StatCard label="Total Revenue (Sandwip)" value={`৳ ${onlineStats.sandwipRevenue}`} icon={FaMoneyBillWave} tone="money" />
              <StatCard label="No Of Refund (Sandwip)" value={onlineRefundStats.sandwipRefundCount} icon={FaUndo} />
              <StatCard label="Amount Refund (Sandwip)" value={`৳ ${onlineRefundStats.sandwipRefundAmount}`} icon={FaCoins} tone="money" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;