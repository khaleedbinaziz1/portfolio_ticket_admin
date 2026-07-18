import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaCloudSun,
  FaPlus,
  FaTimes,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
} from 'react-icons/fa';

const WeatherUpdate = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [postedDate, setPostedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [weatherUpdates, setWeatherUpdates] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);

  const fetchWeatherUpdates = async () => {
    try {
      const response = await axios.get('https://portfolio-ticket-server.vercel.app/getweatherupdates');
      setWeatherUpdates(response.data);
    } catch (error) {
      console.error('Error fetching weather updates:', error);
    }
  };

  useEffect(() => {
    const getBangladeshDate = () => {
      const now = new Date();
      const bangladeshTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
      return bangladeshTime.toISOString().split('T')[0];
    };
    setPostedDate(getBangladeshDate());
    fetchWeatherUpdates();
  }, []);

  const resetForm = () => {
    const getBangladeshDate = () => {
      const now = new Date();
      const bangladeshTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
      return bangladeshTime.toISOString().split('T')[0];
    };
    setTitle('');
    setMessage('');
    setPostedDate(getBangladeshDate());
    setExpiryDate('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !message || !expiryDate) {
      alert('Please fill in all fields');
      return;
    }

    try {
      if (editingUpdate) {
        await axios.put(`https://portfolio-ticket-server.vercel.app/updateweatherupdate/${editingUpdate._id}`, {
          title,
          message,
          postedDate,
          expiryDate,
        });
        alert('Weather update edited successfully');
      } else {
        await axios.post('https://portfolio-ticket-server.vercel.app/addweatherupdate', {
          title,
          message,
          postedDate,
          expiryDate,
          isActive: true,
        });
        alert('Weather update added successfully');
      }

      fetchWeatherUpdates();
      setIsFormVisible(false);
      setEditingUpdate(null);
      resetForm();
    } catch (error) {
      console.error('Error adding/updating weather update:', error);
      alert('Failed to add/update weather update');
    }
  };

  const handleToggleActive = async (updateId, currentState) => {
    try {
      const isActive = !currentState;

      await axios.put(`https://portfolio-ticket-server.vercel.app/updateweatherupdate/${updateId}`, {
        isActive,
      });

      alert(isActive ? 'Weather update activated successfully' : 'Weather update deactivated successfully');
      fetchWeatherUpdates();
    } catch (error) {
      console.error('Error toggling weather update state:', error);
      alert('Failed to toggle weather update state');
    }
  };

  const handleEdit = (update) => {
    setTitle(update.title);
    setMessage(update.message);
    setPostedDate(update.postedDate);
    setExpiryDate(update.expiryDate);
    setEditingUpdate(update);
    setIsFormVisible(true);
  };

  const handleDelete = async (updateId) => {
    try {
      await axios.delete(`https://portfolio-ticket-server.vercel.app/deleteweatherupdate/${updateId}`);
      alert('Weather update deleted successfully');
      fetchWeatherUpdates();
    } catch (error) {
      console.error('Error deleting weather update:', error);
      alert('Failed to delete weather update');
    }
  };

  const handleToggleForm = () => {
    if (isFormVisible) {
      setEditingUpdate(null);
      resetForm();
    }
    setIsFormVisible(!isFormVisible);
  };

  const inputClass =
    "border border-[#E4E9EC] rounded-lg w-full p-2.5 text-[#1F2B33] text-sm focus:outline-none focus:border-[#3F6584]/50 focus:ring-2 focus:ring-[#3F6584]/10";

  return (
    <div className="flex min-h-screen bg-[#FAFBFC]">
      <div className="flex-1 md:ml-52 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-[#3F6584]/10 text-[#3F6584]">
              <FaCloudSun size={16} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1F2B33] tracking-tight">
                Weather Updates
              </h1>
              <p className="text-[13px] text-[#8A97A0]">
                {weatherUpdates.length} update{weatherUpdates.length !== 1 ? 's' : ''} on record
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleForm}
            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 ${
              isFormVisible
                ? 'bg-white border border-[#E4E9EC] text-[#5C6B73] hover:text-[#1F2B33]'
                : 'bg-[#3F6584] text-white hover:bg-[#345368] shadow-sm'
            }`}
          >
            {isFormVisible ? <FaTimes size={13} /> : <FaPlus size={13} />}
            {isFormVisible ? 'Close' : 'Add New Weather Update'}
          </button>
        </div>

        {/* Weather Update Form */}
        {isFormVisible && (
          <div className="bg-white border border-[#E4E9EC] rounded-xl p-5 mb-6">
            <h2 className="text-[13px] font-semibold text-[#5C6B73] uppercase tracking-wide mb-4">
              {editingUpdate ? 'Update Weather Update' : 'Add Weather Update'}
            </h2>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#5C6B73]">Title</label>
                <input
                  type="text"
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[#5C6B73]">Message</label>
                <textarea
                  className={`${inputClass} min-h-[90px] resize-y`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#5C6B73]">Posted Date</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={postedDate}
                    onChange={(e) => setPostedDate(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#5C6B73]">Expiry Date</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#3F6584] hover:bg-[#345368] transition-colors duration-200 rounded-lg shadow-sm"
                >
                  {editingUpdate ? 'Update Weather Update' : 'Add Weather Update'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Weather Updates Table */}
        <div className="bg-white border border-[#E4E9EC] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#E4E9EC]">
            <h3 className="text-[13px] font-semibold text-[#5C6B73] uppercase tracking-wide">
              Weather Updates List
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAFBFC] text-[#5C6B73] text-[12px] uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-semibold">Title</th>
                  <th className="text-left px-4 py-3 font-semibold">Message</th>
                  <th className="text-left px-4 py-3 font-semibold">Posted Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Expiry Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-center px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {weatherUpdates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center px-4 py-10 text-[#8A97A0] text-[13px]">
                      No weather updates yet. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  weatherUpdates.map((update) => (
                    <tr key={update._id} className="border-t border-[#EEF1F3] hover:bg-[#FAFBFC] transition-colors duration-150">
                      <td className="px-4 py-3 font-semibold text-[#1F2B33]">{update.title}</td>
                      <td className="px-4 py-3 text-[#5C6B73] max-w-xs truncate" title={update.message}>{update.message}</td>
                      <td className="px-4 py-3 text-[#5C6B73]">{update.postedDate}</td>
                      <td className="px-4 py-3 text-[#5C6B73]">{update.expiryDate}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(update._id, update.isActive)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors duration-150 ${
                            update.isActive
                              ? 'bg-[#1F8A50]/10 text-[#1F8A50] hover:bg-[#1F8A50]/20'
                              : 'bg-[#B3423E]/10 text-[#B3423E] hover:bg-[#B3423E]/20'
                          }`}
                        >
                          {update.isActive ? <FaToggleOn size={13} /> : <FaToggleOff size={13} />}
                          {update.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(update)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-[#3F6584] hover:bg-[#345368] rounded-md transition-colors duration-200"
                          >
                            <FaEdit size={11} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(update._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-[#B3423E] hover:bg-[#95322E] rounded-md transition-colors duration-200"
                          >
                            <FaTrash size={11} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherUpdate;