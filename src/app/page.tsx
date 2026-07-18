"use client"; // This makes the component a Client Component
import { useState, useEffect } from "react";
import Sidebar from "./Components/Sidebar";
import PriceAll from "./Components/PriceAll";
import Dashboard from "./Components/DashboardHome";
import Empolyeelist from "./Components/EmployeeList";
import TicketBooked from "./Components/TicketsBooked";
import WeatherUpdate from "./Components/WeatherUpdate";
import Online from "./Components/OnlineBooking";
import Login from "./Components/Login/Login";
import Limit from "./Components/Limit";
import Checkin from "./Components/Checkin";

// Define the valid views for type safety
type ViewType =
  | "dashboard"
  | "price"
  | "employee"
  | "counterBookings"
  | "weather"
  | "onlineticket"
  | "limit"
  | "checkin";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false); // Track login status
  const [userRole, setUserRole] = useState<string | null>(null); // Store user role
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");

  useEffect(() => {
    // Restore login state from localStorage
    const storedLoggedIn = localStorage.getItem("loggedIn") === "true";
    const storedUserRole = localStorage.getItem("userRole");
    if (storedLoggedIn && storedUserRole) {
      setLoggedIn(true);
      setUserRole(storedUserRole);
    }
  }, []);

  const handleLoginSuccess = (username: string, role: string) => {
    setLoggedIn(true);
    setUserRole(role);
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userRole", role);
    console.log(`Welcome ${username} with role ${role}`);
  };

  const handleLogout = () => {
    console.log("Logout triggered");
    setLoggedIn(false);
    setUserRole(null);
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userRole");
  };

  if (!loggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar setCurrentView={setCurrentView} onLogout={handleLogout} />
      <div className="flex-1">
        {currentView === "dashboard" && <Dashboard />}
        {currentView === "price" && <PriceAll />}
        {currentView === "employee" && <Empolyeelist />}
        {currentView === "counterBookings" && <TicketBooked />}
        {currentView === "weather" && <WeatherUpdate />}
        {currentView === "onlineticket" && <Online />}
        {currentView === "limit" && <Limit />}
        {currentView === "checkin" && <Checkin />}
      </div>
    </div>
  );
}
