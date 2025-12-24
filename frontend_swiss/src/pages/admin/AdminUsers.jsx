import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listUsers, updateUser } from '@/services/admin.service.js';
import { Pencil } from 'lucide-react';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRoleId, setNewRoleId] = useState('');

  async function refresh() {
    const res = await listUsers();
    setUsers((res.users || []).sort((a, b) => a.id - b.id));
  }

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openModal(user) {
    setSelectedUser(user);
    setNewRoleId(user.role_id || user.permission || 0);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedUser(null);
    setNewRoleId('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const roleNum = parseInt(newRoleId);
    if (isNaN(roleNum)) {
      alert('Role ID phải là số');
      return;
    }
    try {
      await updateUser(selectedUser.id, { role_id: roleNum });
      alert('Đã cập nhật role');
      closeModal();
      await refresh();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.result_message || err.message));
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
                Role ID
              </th>
              <th className="text-right px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {users.length > 0 ? (
              users.map(u => (
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
                    {u.role_id || u.permission || 0}
                  </td>
                  <td className="px-8 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openModal(u)}
                        className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0] bg-white hover:bg-[#3B82F6] hover:border-[#3B82F6] text-[#64748B] hover:text-white transition-all duration-200 cursor-pointer group/btn shadow-sm hover:shadow-md"
                        aria-label={`Edit ${u.username}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-8 py-12 text-center text-[#94A3B8]">
                  Không có người dùng
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal popup */}
      {modalOpen && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden border border-[#E2E8F0]">
            <div className="bg-[#3B82F6] px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5" />
                Sửa Role
              </h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-6">
                <div className="mb-4">
                  <p className="text-[#475569] text-base mb-2">
                    User: <span className="font-semibold text-[#1E293B]">{selectedUser?.username}</span> (ID: {selectedUser?.id})
                  </p>
                  <p className="text-[#475569] text-base mb-4">
                    Role ID hiện tại: <span className="font-semibold text-[#1E293B]">{selectedUser?.role_id || selectedUser?.permission || 0}</span>
                  </p>
                  <label className="block text-sm font-medium text-[#64748B] mb-2">
                    Role ID mới:
                  </label>
                  <input
                    type="number"
                    value={newRoleId}
                    onChange={(e) => setNewRoleId(e.target.value)}
                    className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1E293B]"
                    required
                  />
                </div>
              </div>
              <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all duration-200 cursor-pointer shadow-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                  Lưu
                </button>
              </div>
            </form>
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
