import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listUsers, updateUser, addUser, deleteUser, getUserDetails } from '@/services/admin.service.js';
import { Pencil, Eye, Trash2, Plus, X } from 'lucide-react';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('all');
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    dob: '',
    address: '',
    role_id: 1,
  });

  // Role mapping
  const roleNames = {
    1: 'Người dùng',
    2: 'Người bán',
    3: 'Admin'
  };

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await listUsers();
      setUsers((res.users || []).sort((a, b) => a.id - b.id));
    } finally {
      setLoading(false);
    }
  }

  // Filter users by role
  const filteredUsers = selectedRole === 'all'
    ? users
    : users.filter(u => (u.role_id || u.permission) === parseInt(selectedRole));

  const handleViewDetails = async (user) => {
    try {
      const res = await getUserDetails(user.id);
      setSelectedUser(res.user);
      setShowDetailsModal(true);
    } catch (error) {
      setErrorModal({ show: true, message: 'Không thể tải thông tin người dùng' });
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username || '',
      name: user.name || '',
      email: user.email || '',
      password: '', // Don't populate password for security
      dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
      address: user.address || '',
      role_id: user.role_id || user.permission || 1,
    });
    setShowEditModal(true);
  };

  const handleAddClick = () => {
    setFormData({
      username: '',
      name: '',
      email: '',
      password: '',
      dob: '',
      address: '',
      role_id: 1,
    });
    setShowAddModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await addUser(formData);
      setShowAddModal(false);
      loadUsers();
    } catch (error) {
      console.error('Add user error:', error);
      const errorMsg = error.response?.data?.result_message || error.message;
      console.log('Error message:', errorMsg);
      // Provide more user-friendly error messages
      if (errorMsg.includes('users_username_key') || (errorMsg.includes('duplicate key') && errorMsg.includes('username'))) {
        setErrorModal({ show: true, message: 'Username đã tồn tại. Vui lòng chọn username khác.' });
      } else if (errorMsg.includes('users_email_key') || (errorMsg.includes('duplicate key') && errorMsg.includes('email'))) {
        setErrorModal({ show: true, message: 'Email đã tồn tại. Vui lòng sử dụng email khác.' });
      } else {
        setErrorModal({ show: true, message: 'Lỗi khi thêm người dùng: ' + errorMsg });
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Only send fields that are filled
      const dataToSend = {
        username: formData.username,
        name: formData.name,
        email: formData.email,
        dob: formData.dob,
        address: formData.address,
        role_id: parseInt(formData.role_id),
      };
      // Only include password if it's been changed
      if (formData.password) {
        dataToSend.password = formData.password;
      }
      const res = await updateUser(selectedUser.id, dataToSend);
      setShowEditModal(false);
      loadUsers();
    } catch (error) {
      console.error('Update user error:', error);
      const errorMsg = error.response?.data?.result_message || error.message;
      console.log('Error message:', errorMsg);
      // Provide more user-friendly error messages
      if (errorMsg.includes('users_username_key') || (errorMsg.includes('duplicate key') && errorMsg.includes('username'))) {
        setErrorModal({ show: true, message: 'Username đã tồn tại. Vui lòng chọn username khác.' });
      } else if (errorMsg.includes('users_email_key') || (errorMsg.includes('duplicate key') && errorMsg.includes('email'))) {
        setErrorModal({ show: true, message: 'Email đã tồn tại. Vui lòng sử dụng email khác.' });
      } else {
        setErrorModal({ show: true, message: 'Lỗi khi cập nhật người dùng: ' + errorMsg });
      }
    }
  };

  const handleDeleteClick = (user) => {
    setDeleteConfirm(user);
  };

  const hideDeleteConfirmDialog = () => {
    setDeleteConfirm(null);
  };

  async function handleRemove() {
    try {
      const res = await deleteUser(deleteConfirm.id);
      setUsers(prev => prev.filter(u => u.id !== deleteConfirm.id));
      hideDeleteConfirmDialog();
    } catch (error) {
      setErrorModal({ show: true, message: 'Lỗi khi xóa người dùng: ' + (error.response?.data?.result_message || error.message) });
    }
  }

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><p className="text-[#64748B]">Đang tải…</p></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12 relative">
      {/* Header */}
      <div className="w-full max-w-6xl mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#1E293B] tracking-tight">
              Quản lý người dùng
            </h1>
            <p className="text-[#64748B] mt-2">
              Quản lý danh sách người dùng
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-[#64748B] mb-2">
                Lọc theo vai trò:
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="border border-[#E2E8F0] rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B] bg-white shadow-sm"
              >
                <option value="all">Tất cả</option>
                <option value="1">Người dùng</option>
                <option value="2">Người bán</option>
                <option value="3">Admin</option>
              </select>
            </div>
            <div className="mt-6">
              <button
                onClick={handleAddClick}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                aria-label="Add new user"
              >
                <Plus className="w-5 h-5" />
                Thêm người dùng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full max-w-6xl bg-white border border-[#E2E8F0] overflow-hidden px-8 shadow-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                ID
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Username
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Email
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Address
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Role
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                
              </th>
              <th className="text-right px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(u => (
                <tr
                  key={u.id}
                  className="group hover:bg-[#F8FAFC] transition-colors duration-200"
                >
                  <td className="px-8 py-2 text-sm text-[#64748B] text-left">
                    {u.id}
                  </td>
                  <td className="px-8 py-2 text-base text-[#64748B] text-left">
                    {u.username}
                  </td>
                  <td className="px-8 py-2 text-base text-[#64748B] text-left">
                    {u.email}
                  </td>
                  <td className="px-8 py-2 text-base text-[#64748B] text-left">
                    {u.address || 'N/A'}
                  </td>
                  <td className="px-8 py-2 text-base text-[#64748B] text-left">
                    {roleNames[u.role_id || u.permission] || 'Không xác định'}
                  </td>
                  <td className="px-8 py-2 text-base text-[#64748B] text-left">
                    
                  </td>
                  <td className="px-8 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleViewDetails(u)}
                        className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0] bg-white hover:bg-[#3B82F6] hover:border-[#3B82F6] text-[#64748B] hover:text-white transition-all duration-200 cursor-pointer group/btn shadow-sm hover:shadow-md"
                        aria-label={`View ${u.username}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(u)}
                        className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0] bg-white hover:bg-[#3B82F6] hover:border-[#3B82F6] text-[#64748B] hover:text-white transition-all duration-200 cursor-pointer group/btn shadow-sm hover:shadow-md"
                        aria-label={`Edit ${u.username}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(u)}
                        className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0] bg-white hover:bg-red-600 hover:border-red-600 text-[#64748B] hover:text-white transition-all duration-200 cursor-pointer group/btn shadow-sm hover:shadow-md"
                        aria-label={`Delete ${u.username}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-8 py-12 text-center text-[#94A3B8]">
                  Không có người dùng
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden border border-[#E2E8F0]">
            <div className="bg-[#3B82F6] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Thêm người dùng
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-white hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="px-6 py-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Username:
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleFormChange}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Name:
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Email:
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Date of Birth:
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleFormChange}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Password:
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Address:
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Vai trò:
                  </label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleFormChange}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                  >
                    <option value="1">Người dùng</option>
                    <option value="2">Người bán</option>
                    <option value="3">Admin</option>
                  </select>
                </div>
              </div>
              <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all duration-200 cursor-pointer shadow-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden border border-[#E2E8F0]">
            <div className="bg-[#3B82F6] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5" />
                Sửa người dùng
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-white hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="px-6 py-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Username:
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleFormChange}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Name:
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Email:
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Date of Birth:
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleFormChange}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Password mới (để trống nếu không đổi):
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                    placeholder="Để trống nếu không đổi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Address:
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Vai trò:
                  </label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleFormChange}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                  >
                    <option value="1">Người dùng</option>
                    <option value="2">Người bán</option>
                    <option value="3">Admin</option>
                  </select>
                </div>
              </div>
              <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all duration-200 cursor-pointer shadow-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden border border-[#E2E8F0]">
            <div className="bg-[#3B82F6] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Chi tiết người dùng
              </h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-white hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-[#64748B]">ID:</p>
                <p className="text-base text-[#1E293B] font-semibold">{selectedUser.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#64748B]">Username:</p>
                <p className="text-base text-[#1E293B] font-semibold">{selectedUser.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#64748B]">Name:</p>
                <p className="text-base text-[#1E293B]">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#64748B]">Email:</p>
                <p className="text-base text-[#1E293B]">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#64748B]">Date of Birth:</p>
                <p className="text-base text-[#1E293B]">{selectedUser.dob ? new Date(selectedUser.dob).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#64748B]">Address:</p>
                <p className="text-base text-[#1E293B]">{selectedUser.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#64748B]">Vai trò:</p>
                <p className="text-base text-[#1E293B]">{roleNames[selectedUser.role_id || selectedUser.permission] || 'Không xác định'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#64748B]">Total Ratings:</p>
                <p className="text-base text-[#1E293B]">{selectedUser.total_ratings || 0}</p>
              </div>
            </div>
            <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden border border-[#E2E8F0]">
            <div className="bg-[#3B82F6] px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Xác nhận xóa
              </h2>
            </div>
            <div className="px-6 py-6">
              <p className="text-[#475569] text-base">
                Bạn có chắc chắn muốn xóa người dùng <span className="font-semibold text-[#1E293B]">{deleteConfirm.username}</span> không?
              </p>
            </div>
            <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={hideDeleteConfirmDialog}
                className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all duration-200 cursor-pointer shadow-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleRemove}
                className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setErrorModal({ show: false, message: "" })} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden border border-[#E2E8F0]">
            <div className="bg-[#3B82F6] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Thông báo</h2>
              <button 
                onClick={() => setErrorModal({ show: false, message: "" })} 
                className="text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="text-[#475569] text-base">{errorModal.message}</p>
            </div>
            <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end">
              <button
                onClick={() => setErrorModal({ show: false, message: "" })}
                className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg rounded"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button onClick={() => navigate('/admin')} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 shadow-lg">
          ← Quay lại
        </button>
      </div>
    </div>
  );
}
