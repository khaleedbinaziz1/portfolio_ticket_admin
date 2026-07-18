"use client";
import React, { useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import logo from '../../../Images/kumira-ghat.png';
import bg from '../../../Images/background.jpg';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaExclamationCircle, FaAnchor } from 'react-icons/fa';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await axios.get('https://portfolio-ticket-server.vercel.app/getEmployees');
      const employees = response.data;

      const user = employees.find((emp) => emp.username === username && emp.password === password);

      if (user) {
        if (user.role === 'Admin') {
          setError('');
          onLoginSuccess(user.username, user.role);
        } else {
          setError('You are not authorized. Only Admins can log in.');
        }
      } else {
        setError('Invalid username or password.');
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col lg:flex-row min-h-screen bg-white overflow-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Photo panel */}
      <div className="relative w-full h-[240px] lg:h-auto lg:w-1/2 lg:min-h-screen">
        <Image src={bg} alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#16232E]/90 via-[#1F2B33]/60 to-[#3F6584]/20" />

        <div className="relative z-10 flex flex-col justify-between h-full p-6 sm:p-10 lg:p-14 font-body">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-11 h-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-[#D9A441] border border-white/20">
              <FaAnchor size={16} />
            </span>
            <Image src={logo} alt="Kumira Ghat" width={38} height={38} className="rounded-full hidden sm:block" />
          </div>

          <div className="hidden lg:block">
            <p className="text-[12px] font-semibold tracking-[0.2em] text-[#D9A441] uppercase mb-3">
              Kumira &middot; Guptachara &middot; Sandwip
            </p>
            <h1 className="font-display text-white text-4xl xl:text-[42px] leading-[1.15] mb-4">
              Two shores,<br />one crossing.
            </h1>
            <p className="text-white/70 text-[15px] max-w-xs leading-relaxed">
              Sign in to manage ferry bookings, fares, and the people who keep the route running.
            </p>
          </div>
        </div>

        {/* Wave divider — desktop (vertical) */}
        <svg
          className="hidden lg:block absolute top-0 right-0 h-full w-16 translate-x-1/2"
          viewBox="0 0 100 1000"
          preserveAspectRatio="none"
        >
          <path
            d="M50,0 C10,90 90,160 50,260 C10,360 90,430 50,530 C10,630 90,700 50,800 C10,880 90,940 50,1000 L100,1000 L100,0 Z"
            fill="white"
          />
        </svg>

        {/* Wave divider — mobile (horizontal) */}
        <svg
          className="lg:hidden absolute bottom-0 left-0 w-full h-10 translate-y-1/2"
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0,50 C90,10 160,90 260,50 C360,10 430,90 530,50 C630,10 700,90 800,50 C880,10 940,90 1000,50 L1000,100 L0,100 Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Form panel */}
      <div className="relative flex-1 flex items-center justify-center p-6 sm:p-10 font-body">
        <div
          className="w-full max-w-sm"
          style={{ animation: 'fadeInUp 0.55s ease-out' }}
        >
          <div className="mb-8">
            <p className="text-[12px] font-semibold tracking-[0.2em] text-[#3F6584] uppercase mb-2">
              Admin Panel
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-[#1F2B33] mb-2">
              Sign in
            </h2>
            <p className="text-[#8A97A0] text-[14px]">
              Enter your credentials to manage the ferry service.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#5C6B73]">Username</label>
              <div className="relative">
                <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A97A0]" size={13} />
                <input
                  type="text"
                  placeholder="Enter your username"
                  className="w-full border border-[#E4E9EC] rounded-lg pl-10 pr-3 py-3 text-[#1F2B33] text-sm focus:outline-none focus:border-[#3F6584]/50 focus:ring-2 focus:ring-[#3F6584]/10 transition-shadow duration-150"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[#5C6B73]">Password</label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A97A0]" size={13} />
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full border border-[#E4E9EC] rounded-lg pl-10 pr-10 py-3 text-[#1F2B33] text-sm focus:outline-none focus:border-[#3F6584]/50 focus:ring-2 focus:ring-[#3F6584]/10 transition-shadow duration-150"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A97A0] hover:text-[#5C6B73] transition-colors duration-150"
                  tabIndex={-1}
                >
                  {isPasswordVisible ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-[#B3423E]/10 text-[#B3423E] text-[13px] rounded-lg px-3 py-2.5">
                <FaExclamationCircle className="mt-0.5 shrink-0" size={13} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 flex items-center justify-center gap-2 text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-200 shadow-sm ${
                loading ? 'bg-[#8A97A0] cursor-not-allowed' : 'bg-[#3F6584] hover:bg-[#345368]'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-30"
                      cx="12" cy="12" r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      fill="#D9A441"
                      d="M4 12a8 8 0 018-8V0C6.477 0 0 6.477 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;