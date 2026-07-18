import React, { useState } from 'react';
import axios from 'axios';
import {
  FaUserPlus,
  FaUsers,
  FaTimes,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';

// Shared palette, kept in sync with the dashboard.
const STEEL = '#3F6584';
const AMBER = '#D9A441';

const EmployeeList = () => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [station, setStation] = useState('Kumira');
  const [role, setRole] = useState('Employee');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phoneRegex = /^01\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert('Invalid phone number. It should be 11 digits and start with 01.');
      return;
    }

    if (!fullName || !username || !password) {
      alert('Please fill in all fields');
      return;
    }

    if (username.includes(' ') || password.includes(' ')) {
      alert('Username and Password cannot contain spaces');
      return;
    }

    try {
      const employeeData = {
        fullName,
        phoneNumber,
        station,
        role,
        username,
        password,
      };

      if (editingEmployee) {
        await axios.put(`https://portfolio-ticket-server.vercel.app/updateemployee/${editingEmployee._id}`, employeeData);
      } else {
        await axios.post('https://portfolio-ticket-server.vercel.app/addemployee', employeeData);
      }

      alert('Employee added/updated successfully');
      fetchEmployees();
      setIsFormVisible(false);
      setEditingEmployee(null);
      resetForm();
    } catch (error) {
      console.error('Error adding/updating employee:', error);
      alert('Failed to add/update employee');
    }
  };

  const resetForm = () => {
    setFullName('');
    setPhoneNumber('');
    setStation('Kumira');
    setRole('Employee');
    setUsername('');
    setPassword('');
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('https://portfolio-ticket-server.vercel.app/getemployees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEdit = (employee) => {
    setFullName(employee.fullName);
    setPhoneNumber(employee.phoneNumber);
    setStation(employee.station);
    setRole(employee.role);
    setUsername(employee.username);
    setPassword(employee.password);
    setEditingEmployee(employee);
    setIsFormVisible(true);
  };

  const handleDelete = async (employeeId) => {
    try {
      await axios.delete(`https://portfolio-ticket-server.vercel.app/deleteemployee/${employeeId}`);
      alert('Employee deleted successfully');
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee');
    }
  };

  const handleToggleForm = () => {
    if (isFormVisible) {
      setEditingEmployee(null);
      resetForm();
    }
    setIsFormVisible(!isFormVisible);
  };

  return (
    <div className="flex min-h-screen bg-[#FAFBFC]">
      <div className="flex-1 md:ml-52 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-[#3F6584]/10 text-[#3F6584]">
              <FaUsers size={16} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1F2B33] tracking-tight">
                Employee Database
              </h1>
              <p className="text-[13px] text-[#8A97A0]">{employees.length} employee{employees.length !== 1 ? 's' : ''} on record</p>
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
            {isFormVisible ? <FaTimes size={13} /> : <FaUserPlus size={13} />}
            {isFormVisible ? 'Close' : 'Add New Employee'}
          </button>
        </div>

        {/* Employee Form */}
        {isFormVisible && (
          <div className="bg-white border border-[#E4E9EC] rounded-xl p-5 mb-6">
            <h2 className="text-[13px] font-semibold text-[#5C6B73] uppercase tracking-wide mb-4">
              {editingEmployee ? 'Update Employee' : 'Add Employee'}
            </h2>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#5C6B73]">Full Name</label>
                  <input
                    type="text"
                    className="border border-[#E4E9EC] rounded-lg w-full p-2.5 text-[#1F2B33] text-sm focus:outline-none focus:border-[#3F6584]/50 focus:ring-2 focus:ring-[#3F6584]/10"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {/* Phone Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#5C6B73]">Phone Number</label>
                  <input
                    type="tel"
                    className="border border-[#E4E9EC] rounded-lg w-full p-2.5 text-[#1F2B33] text-sm focus:outline-none focus:border-[#3F6584]/50 focus:ring-2 focus:ring-[#3F6584]/10"
                    value={phoneNumber}
                    onChange={(e) => {
                      const inputValue = e.target.value.replace(/\D/g, '');
                      setPhoneNumber(inputValue);
                    }}
                    maxLength={11}
                    required
                  />
                  {!/^01\d{9}$/.test(phoneNumber) && phoneNumber !== '' && (
                    <p className="text-[#B3423E] text-[12px]">
                      Phone number must be 11 digits and start with "01".
                    </p>
                  )}
                </div>

                {/* Station */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#5C6B73]">Station</label>
                  <select
                    className="border border-[#E4E9EC] rounded-lg w-full p-2.5 text-[#1F2B33] text-sm focus:outline-none focus:border-[#3F6584]/50 focus:ring-2 focus:ring-[#3F6584]/10"
                    value={station}
                    onChange={(e) => setStation(e.target.value)}
                  >
                    <option value="Kumira">Kumira</option>
                    <option value="Sandip">Sandip</option>
                  </select>
                </div>

                {/* Role */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#5C6B73]">Role</label>
                  <select
                    className="border border-[#E4E9EC] rounded-lg w-full p-2.5 text-[#1F2B33] text-sm focus:outline-none focus:border-[#3F6584]/50 focus:ring-2 focus:ring-[#3F6584]/10"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Scanner">Scanner</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#5C6B73]">Username</label>
                  <input
                    type="text"
                    className="border border-[#E4E9EC] rounded-lg w-full p-2.5 text-[#1F2B33] text-sm focus:outline-none focus:border-[#3F6584]/50 focus:ring-2 focus:ring-[#3F6584]/10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[#5C6B73]">Password</label>
                  <div className="relative">
                    <input
                      type={isPasswordVisible ? 'text' : 'password'}
                      className="border border-[#E4E9EC] rounded-lg w-full p-2.5 pr-10 text-[#1F2B33] text-sm focus:outline-none focus:border-[#3F6584]/50 focus:ring-2 focus:ring-[#3F6584]/10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8A97A0] hover:text-[#5C6B73]"
                    >
                      {isPasswordVisible ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#3F6584] hover:bg-[#345368] transition-colors duration-200 rounded-lg shadow-sm"
                >
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Employee Table */}
        <div className="bg-white border border-[#E4E9EC] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#E4E9EC]">
            <h3 className="text-[13px] font-semibold text-[#5C6B73] uppercase tracking-wide">
              Employee List
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAFBFC] text-[#5C6B73] text-[12px] uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-semibold">Full Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Phone No</th>
                  <th className="text-left px-4 py-3 font-semibold">Station</th>
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                  <th className="text-left px-4 py-3 font-semibold">Username</th>
                  <th className="text-left px-4 py-3 font-semibold">Password</th>
                  <th className="text-center px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center px-4 py-10 text-[#8A97A0] text-[13px]">
                      No employees yet. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee._id} className="border-t border-[#EEF1F3] hover:bg-[#FAFBFC] transition-colors duration-150">
                      <td className="px-4 py-3 font-semibold text-[#1F2B33]">{employee.fullName}</td>
                      <td className="px-4 py-3 text-[#5C6B73]">{employee.phoneNumber}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#3F6584]/10 text-[#3F6584]">
                          {employee.station}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium bg-[#D9A441]/15 text-[#8A6A1F]">
                          {employee.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#5C6B73]">{employee.username}</td>
                      <td className="px-4 py-3 text-[#5C6B73] font-mono">{employee.password}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(employee)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-[#3F6584] hover:bg-[#345368] rounded-md transition-colors duration-200"
                          >
                            <FaEdit size={11} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(employee._id)}
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

export default EmployeeList;