"use client";

import React, { useEffect, useState } from "react";
import {
  FaShip,
  FaWeightHanging,
  FaMoneyBillWave,
  FaCheckCircle,
  FaSave,
} from "react-icons/fa";

const STEEL = "#3F6584";

const BOAT_LABELS = {
  speedBoat: "Speed Boat",
  serviceBoat: "Service Boat",
  malBoat: "Mal Boat",
};

/** Pill toggle used for Website Status / Dashboard Status. */
const StatusToggle = ({ label, lastValue, value, onToggle }) => {
  const isOn = value === "On";
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[13px] font-medium text-[#3B4A52]">{label}</p>
        <p className="text-[11px] text-[#8A97A0]">Last: {lastValue ?? "Off"}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`px-4 py-1.5 text-[13px] font-semibold rounded-full transition-colors duration-200 ${
          isOn
            ? "bg-[#1F8A50]/10 text-[#1F8A50] border border-[#1F8A50]/30"
            : "bg-[#B23A2E]/10 text-[#B23A2E] border border-[#B23A2E]/30"
        }`}
      >
        {isOn ? "On — Turn Off" : "Off — Turn On"}
      </button>
    </div>
  );
};

/** Labeled number input, controlled so it stays in sync after a save. */
const PriceField = ({ label, lastValue, value, onChange }) => (
  <div>
    <div className="flex items-baseline justify-between mb-1">
      <label className="text-[13px] font-medium text-[#3B4A52]">{label}</label>
      <span className="text-[11px] text-[#8A97A0]">Last: {lastValue ?? "N/A"}</span>
    </div>
    <input
      type="number"
      placeholder={`Enter ${label}`}
      className="w-full text-[14px] border border-[#E4E9EC] rounded-lg px-3 py-2 text-[#1F2B33] focus:outline-none focus:ring-2 focus:ring-[#3F6584]/30 focus:border-[#3F6584]"
      value={value ?? ""}
      onChange={onChange}
    />
  </div>
);

const PriceAll = () => {
  const [prices, setPrices] = useState(null);
  const [updatedPrices, setUpdatedPrices] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [updateMessage, setUpdateMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await fetch("https://portfolio-ticket-server.vercel.app/pricenweight");
      if (!response.ok) throw new Error("Failed to fetch prices");
      const data = await response.json();
      setPrices(data[0]);
      // Controlled inputs read from this state, so re-running fetchPrices
      // after a save also refreshes what's shown in the fields — with the
      // old defaultValue approach the inputs would silently keep showing
      // stale numbers after a successful update.
      setUpdatedPrices({ ...data[0] });

      if (data[0]?.lastUpdated) {
        setLastUpdated(new Date(data[0].lastUpdated).toLocaleString());
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const handlePriceChange = (e, boatType, priceType) => {
    const value = e.target.value;
    setUpdatedPrices((prev) => ({
      ...prev,
      [boatType]: {
        ...prev[boatType],
        [priceType]: value,
      },
    }));
  };

  const handleToggle = (boatType, field) => {
    setUpdatedPrices((prev) => ({
      ...prev,
      [boatType]: {
        ...prev[boatType],
        [field]: prev[boatType]?.[field] === "On" ? "Off" : "On",
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setUpdateMessage(null);
    try {
      const response = await fetch("https://portfolio-ticket-server.vercel.app/pricenweight", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPrices),
      });

      if (!response.ok) throw new Error("Failed to update prices");

      const result = await response.json();
      console.log(result.message);

      await fetchPrices();
      setUpdateMessage({ type: "success", text: "Prices have been successfully updated." });
    } catch (error) {
      console.error("Error submitting prices:", error);
      setUpdateMessage({ type: "error", text: "Failed to update prices. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAFBFC]">
      <div className="flex-1 mx-auto max-w-5xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-[#3F6584]/10 text-[#3F6584]">
            <FaShip size={16} />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1F2B33] tracking-tight">Set Boat Prices</h1>
            <p className="text-[13px] text-[#8A97A0]">Last Updated: {lastUpdated ?? "Never"}</p>
          </div>
        </div>

        {updateMessage && (
          <div
            className={`flex items-center gap-2 text-[13px] font-medium rounded-lg px-4 py-3 mb-6 border ${
              updateMessage.type === "success"
                ? "bg-[#1F8A50]/10 text-[#1F8A50] border-[#1F8A50]/30"
                : "bg-[#B23A2E]/10 text-[#B23A2E] border-[#B23A2E]/30"
            }`}
          >
            <FaCheckCircle size={14} />
            {updateMessage.text}
          </div>
        )}

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          {["speedBoat", "serviceBoat", "malBoat"].map((boatType) => (
            <div
              key={boatType}
              className="bg-white border border-[#E4E9EC] rounded-xl p-5 space-y-4"
            >
              <h3 className="text-[15px] font-semibold text-[#1F2B33]">{BOAT_LABELS[boatType]}</h3>

              <PriceField
                label="Passenger Price"
                lastValue={prices?.[boatType]?.passengerPrice}
                value={updatedPrices?.[boatType]?.passengerPrice}
                onChange={(e) => handlePriceChange(e, boatType, "passengerPrice")}
              />

              {boatType === "speedBoat" && (
                <PriceField
                  label="Half Ticket Price"
                  lastValue={prices?.[boatType]?.halfticket}
                  value={updatedPrices?.[boatType]?.halfticket}
                  onChange={(e) => handlePriceChange(e, boatType, "halfticket")}
                />
              )}

              {(boatType === "serviceBoat" || boatType === "malBoat") && (
                <div className="space-y-3 pt-1">
                  <StatusToggle
                    label="Website Status"
                    lastValue={prices?.[boatType]?.status}
                    value={updatedPrices?.[boatType]?.status}
                    onToggle={() => handleToggle(boatType, "status")}
                  />
                  <StatusToggle
                    label="Dashboard Status"
                    lastValue={prices?.[boatType]?.dashstatus}
                    value={updatedPrices?.[boatType]?.dashstatus}
                    onToggle={() => handleToggle(boatType, "dashstatus")}
                  />
                </div>
              )}
            </div>
          ))}

          <div className="bg-white border border-[#E4E9EC] rounded-xl p-5 space-y-4">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[#1F2B33]">
              <FaWeightHanging size={14} className="text-[#3F6584]" />
              Weight Price
            </h3>
            <PriceField
              label="Per 20 Kg"
              lastValue={prices?.weightPricePerKg?.weightPrice}
              value={updatedPrices?.weightPricePerKg?.weightPrice}
              onChange={(e) => handlePriceChange(e, "weightPricePerKg", "weightPrice")}
            />
          </div>

          <div className="md:col-span-2 flex justify-center pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-[#3F6584] text-white text-[14px] font-semibold hover:bg-[#345366] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FaSave size={13} />
              {saving ? "Saving..." : "Update Prices"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PriceAll;