import React, { useState, useEffect } from "react";
import { FaSlidersH, FaTicketAlt, FaUsers, FaMobileAlt, FaCheckCircle } from "react-icons/fa";

const Limit = () => {
  const [ticketLimit, setTicketLimit] = useState(0);
  const [passengerLimit, setPassengerLimit] = useState(0);
  const [ticketPerPhoneNumber, setTicketPerPhoneNumber] = useState(0);
  const [fetchedLimits, setFetchedLimits] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const response = await fetch("https://portfolio-ticket-server.vercel.app/limits");
        if (!response.ok) {
          throw new Error("Failed to fetch limits");
        }
        const data = await response.json();
        if (data.length > 0) {
          setFetchedLimits(data[0]);
          setTicketLimit(data[0].PerDayTicket || 0);
          setPassengerLimit(data[0].PersonPerTicket || 0);
          setTicketPerPhoneNumber(data[0].TicketPerPhoneNumber || 0);
          setLastUpdated(data[0].updatedAt || "N/A");
        }
      } catch (error) {
        console.error("Error fetching limits:", error);
        alert("Failed to fetch limits");
      }
    };

    fetchLimits();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const timestamp = new Date().toISOString();
    const updatedLimits = {
      PerDayTicket: Number(ticketLimit),
      PersonPerTicket: Number(passengerLimit),
      TicketPerPhoneNumber: Number(ticketPerPhoneNumber),
      updatedAt: timestamp,
    };

    try {
      const response = await fetch("https://portfolio-ticket-server.vercel.app/limits", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedLimits),
      });

      if (!response.ok) {
        throw new Error("Failed to update limits");
      }

      await response.json();
      setFetchedLimits(updatedLimits);
      setMessage("Limits updated successfully!");
      setLastUpdated(timestamp);
    } catch (error) {
      console.error("Error updating limit:", error);
      setMessage("Failed to update limits");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      })
    : "N/A";

  return (
    <div className="flex min-h-screen bg-[#FAFBFC]">
      <div className="flex-1 md:ml-52 p-4 sm:p-6 flex items-start justify-center">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-[#3F6584]/10 text-[#3F6584]">
              <FaSlidersH size={16} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1F2B33] tracking-tight">
                Booking Limits
              </h1>
              <p className="text-[13px] text-[#8A97A0]">Last updated: {formattedLastUpdated}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-[#E4E9EC] rounded-xl p-5">
            <h2 className="text-[13px] font-semibold text-[#5C6B73] uppercase tracking-wide mb-4">
              Set Limits
            </h2>

            <div className="space-y-4">
              {/* Per day ticket limit */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-[13px] font-medium text-[#5C6B73]">
                  <FaTicketAlt size={12} className="text-[#3F6584]" />
                  Ticket Limit in One Day
                </label>
                <input
                  type="number"
                  value={ticketLimit}
                  onChange={(e) => setTicketLimit(e.target.value)}
                  className="border border-[#E4E9EC] rounded-lg w-full p-2.5 text-[#1F2B33] text-sm focus:outline-none focus:border-[#3F6584]/50 focus:ring-2 focus:ring-[#3F6584]/10"
                  placeholder="Enter ticket limit"
                />
                <span className="text-[12px] text-[#8A97A0]">
                  Current: {fetchedLimits.PerDayTicket ?? "N/A"}
                </span>
              </div>

              {/* Passengers per ticket */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-[13px] font-medium text-[#5C6B73]">
                  <FaUsers size={12} className="text-[#3F6584]" />
                  Total Passengers Per Ticket
                </label>
                <input
                  type="number"
                  value={passengerLimit}
                  onChange={(e) => setPassengerLimit(e.target.value)}
                  className="border border-[#E4E9EC] rounded-lg w-full p-2.5 text-[#1F2B33] text-sm focus:outline-none focus:border-[#3F6584]/50 focus:ring-2 focus:ring-[#3F6584]/10"
                  placeholder="Enter passenger limit"
                />
                <span className="text-[12px] text-[#8A97A0]">
                  Current: {fetchedLimits.PersonPerTicket ?? "N/A"}
                </span>
              </div>

              {/* Tickets per phone number */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-[13px] font-medium text-[#5C6B73]">
                  <FaMobileAlt size={12} className="text-[#3F6584]" />
                  Tickets Per Phone Number
                </label>
                <input
                  type="number"
                  value={ticketPerPhoneNumber}
                  onChange={(e) => setTicketPerPhoneNumber(e.target.value)}
                  className="border border-[#E4E9EC] rounded-lg w-full p-2.5 text-[#1F2B33] text-sm focus:outline-none focus:border-[#3F6584]/50 focus:ring-2 focus:ring-[#3F6584]/10"
                  placeholder="Enter tickets per phone number"
                />
                <span className="text-[12px] text-[#8A97A0]">
                  Current: {fetchedLimits.TicketPerPhoneNumber ?? "N/A"}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors duration-200 shadow-sm ${
                isSubmitting
                  ? "bg-[#8A97A0] cursor-not-allowed"
                  : "bg-[#3F6584] hover:bg-[#345368]"
              }`}
            >
              {isSubmitting ? "Updating..." : "Update Limits"}
            </button>

            {message && (
              <p className="flex items-center justify-center gap-1.5 mt-4 text-[13px] font-medium text-[#1F8A50]">
                <FaCheckCircle size={12} />
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Limit;