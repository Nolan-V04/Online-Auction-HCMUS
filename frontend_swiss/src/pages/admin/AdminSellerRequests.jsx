import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listSellerRequests, approveSellerRequest, rejectSellerRequest } from '@/services/admin.service.js';
import { CheckCircle, XCircle } from 'lucide-react';

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminSellerRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const res = await listSellerRequests();
    console.log('Seller requests data:', res.requests);
    setRequests((res.requests || []).sort((a, b) => a.id - b.id));
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

  async function handleApprove(r) {
    if (!confirm(`Duyệt nâng cấp user ${r.name || r.user_id} thành seller 7 ngày?`)) return;
    const res = await approveSellerRequest(r.id);
    alert(res.result_message || 'Đã duyệt');
    await refresh();
  }

  async function handleReject(r) {
    const note = prompt('Lý do từ chối?');
    const res = await rejectSellerRequest(r.id, note || '');
    alert(res.result_message || 'Đã từ chối');
    await refresh();
  }

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><p className="text-[#64748B]">Đang tải…</p></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12">
      {/* Header */}
      <div className="w-full max-w-6xl mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#1E293B] tracking-tight">
              Yêu cầu nâng cấp tài khoản
            </h1>
            <p className="text-[#64748B] mt-2">
              Quản lý yêu cầu nâng cấp lên seller
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
                User
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Gửi lúc
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Quyết định
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Hết hạn
              </th>
              <th className="text-right px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {requests.length > 0 ? (
              requests.map(r => (
                <tr
                  key={r.id}
                  className="group hover:bg-[#F8FAFC] transition-colors duration-200"
                >
                  <td className="px-8 py-2 text-sm text-[#64748B] text-left">
                    {r.id}
                  </td>
                  <td className="px-8 py-2 text-base text-[#64748B] text-left">
                    {r.name || r.email || r.user_id}
                  </td>
                  <td className="px-8 py-2 text-base text-left">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                      r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      r.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-8 py-2 text-sm text-[#64748B] text-left">
                    {formatDateTime(r.created_at)}
                  </td>
                  <td className="px-8 py-2 text-sm text-[#64748B] text-left">
                    {formatDateTime(r.decided_at)}
                  </td>
                  <td className="px-8 py-2 text-sm text-[#64748B] text-left">
                    {formatDateTime(r.expires_at)}
                  </td>
                  <td className="px-8 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {r.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(r)}
                            className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0] bg-white hover:bg-[#10B981] hover:border-[#10B981] text-[#64748B] hover:text-white transition-all duration-200 cursor-pointer group/btn shadow-sm hover:shadow-md"
                            aria-label="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(r)}
                            className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0] bg-white hover:bg-[#EF4444] hover:border-[#EF4444] text-[#64748B] hover:text-white transition-all duration-200 cursor-pointer group/btn shadow-sm hover:shadow-md"
                            aria-label="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-8 py-12 text-center text-[#94A3B8]">
                  Không có yêu cầu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Back button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button onClick={() => navigate('/admin')} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 shadow-lg">
          ← Quay lại
        </button>
      </div>
    </div>
  );
}
