import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import generateCustomPDF from './CustomPDF';
import * as XLSX from 'xlsx';

const OnlineBooking = () =>{
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="text-center mt-5 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-700 text-center mb-6">Online Bookings</h1>
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-4">
        {bookings.length > 0 ? (
          <table className="min-w-full table-auto">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2 text-left">Customer Name</th>
                <th className="px-4 py-2 text-left">Phone</th>
                <th className="px-4 py-2 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{booking.cus_name}</td>
                  <td className="px-4 py-2">{booking.cus_phone}</td>
                  <td className="px-4 py-2 text-right">${booking.total_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center text-gray-500">No bookings found.</div>
        )}
      </div>
    </div>
  );
}
export default OnlineBooking;
