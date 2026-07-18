import React, { useState, useCallback } from "react";
import Image from "next/image";
import logo from "../../Images/kumira-ghat.png";
import {
  FaHome,
  FaStore,
  FaUsers,
  FaTag,
  FaCloudSun,
  FaBars,
  FaGlobe,
  FaSignOutAlt,
  FaStopwatch,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";

/**
 * Static data lives at module scope so it's created once, not rebuilt
 * on every render (including every activeView change).
 */
const MENU_ITEMS = [
  { id: "dashboard", icon: FaHome, label: "Home" },
  { id: "checkin", icon: FaCheckCircle, label: "Check-Ins" },
  { id: "price", icon: FaTag, label: "Price List" },
  { id: "employee", icon: FaUsers, label: "Employee" },
  { id: "limit", icon: FaStopwatch, label: "Limit" },
  { id: "counterBookings", icon: FaStore, label: "Counter" },
  { id: "onlineticket", icon: FaGlobe, label: "Online" },
  { id: "weather", icon: FaCloudSun, label: "Weather" },
];

const Sidebar = ({ setCurrentView, onLogout }) => {
  const [activeView, setActiveView] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleViewChange = useCallback(
    (view) => {
      setActiveView(view);
      setCurrentView(view);
      setIsMobileMenuOpen(false);
    },
    [setCurrentView]
  );

  // Signature element: each nav item is a "stop" on a vertical route line,
  // the way stops sit along a ferry route on a transit map. The active
  // stop lights up amber with a soft halo; the rest are hollow rings
  // threaded on the same line.
  const renderMenu = () => (
    <ul className="px-4">
      {MENU_ITEMS.map((item, index) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        const isLast = index === MENU_ITEMS.length - 1;

        return (
          <li key={item.id} className="relative pl-5">
            {!isLast && (
              <span className="absolute left-[6px] top-1/2 h-full w-px bg-[#3F6584]/30" />
            )}
            <span
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                isActive
                  ? "bg-[#D9A441] border-[#D9A441] shadow-[0_0_0_4px_rgba(217,164,65,0.22)]"
                  : "bg-[#16232B] border-[#3F6584]"
              }`}
            />
            <button
              onClick={() => handleViewChange(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center gap-3 py-2.5 pl-3 pr-3 my-1 w-full text-left rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-[#3F6584]/25 text-white shadow-[0_0_16px_rgba(63,101,132,0.35)]"
                  : "text-[#9FB6C4] hover:bg-[#3F6584]/10 hover:text-white"
              }`}
            >
              <Icon
                size={16}
                className={`transition-colors duration-200 ${
                  isActive ? "text-[#D9A441]" : "text-[#5F86A0] group-hover:text-[#D9A441]"
                }`}
              />
              <span
                className={`text-[13px] tracking-wide ${
                  isActive ? "font-semibold" : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );

  const brandBlock = (
    <div className="relative flex flex-col items-center pt-6 pb-5">
      {/* Soft ambient glow behind the logo, using the steel-blue as light rather than a flat fill */}
      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_50%_20%,rgba(63,101,132,0.45),transparent_70%)] pointer-events-none" />
      <div className="relative p-[3px] rounded-full bg-gradient-to-br from-[#D9A441] to-[#B27C1E]">
        <div className="rounded-full bg-[#16232B] p-[3px]">
          <Image
            src={logo}
            alt="Kumira Ghat Ferry"
            width={60}
            height={60}
            className="rounded-full"
          />
        </div>
      </div>
      <h2 className="relative text-white font-semibold text-[15px] mt-3 tracking-wide">
        Kumira Ghat
      </h2>
      <div className="relative flex items-center gap-1.5 mt-1">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6FCF97] opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#6FCF97]" />
        </span>
        <span className="text-[#89AEC2] text-[10px] tracking-widest uppercase">
          Terminal Live
        </span>
      </div>
      <div className="relative w-10 h-px bg-[#3F6584]/40 mt-5" />
    </div>
  );

  const logoutButton = (
    <button
      onClick={onLogout}
      className="flex items-center justify-center gap-2 py-2.5 px-3 w-full rounded-xl border border-[#B23A2E]/40 text-[#F0B4A9] hover:bg-[#7A2E24] hover:text-white hover:border-transparent transition-colors duration-200 text-[13px] font-medium"
    >
      <FaSignOutAlt size={15} />
      <span>Logout</span>
    </button>
  );

  return (
    <div style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
      {/* Desktop sidebar — square outer edge, steel-blue glow instead of flat black */}
      <div className="hidden md:flex md:flex-col fixed top-0 left-0 h-screen w-52 bg-gradient-to-b from-[#16232B] via-[#1B2E38] to-[#16232B] shadow-[4px_0_24px_rgba(63,101,132,0.2)] z-20">
        {brandBlock}
        <div className="flex-1 overflow-y-auto pb-2">{renderMenu()}</div>
        <div className="p-3 border-t border-[#3F6584]/20">{logoutButton}</div>
      </div>

      {/* Mobile trigger */}
      <div className="md:hidden">
        <button
          className="fixed top-4 left-4 z-30 bg-[#16232B] text-white p-3 rounded-full shadow-lg"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
        </button>

        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="flex flex-col h-screen w-64 bg-gradient-to-b from-[#16232B] via-[#1B2E38] to-[#16232B] shadow-2xl z-30"
              onClick={(e) => e.stopPropagation()}
            >
              {brandBlock}
              <div className="flex-1 overflow-y-auto pb-2">{renderMenu()}</div>
              <div className="p-3 border-t border-[#3F6584]/20">{logoutButton}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoized: setCurrentView and onLogout are typically stable callbacks
// from the parent, so Sidebar can skip re-rendering on unrelated
// dashboard state changes.
export default React.memo(Sidebar);