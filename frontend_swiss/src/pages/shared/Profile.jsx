import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, changePassword, getRatings, getSellerRequest, createSellerRequest } from '@/services/profile.service.js';
import { useAuth } from '@/contexts/AuthContext';

function maskUsername(username) {
  if (!username) return '****';
  if (username.length <= 2) return '****';
  return '****' + username.slice(-Math.min(4, username.length));
}

function formatDateTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function RatingSummary({ summary }) {
  const total = summary.total || 0;
  const positive = summary.positive || 0;
  const negative = summary.negative || 0;
  const percentage = total === 0 ? 0 : Math.round((positive / total) * 100);

  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">Điểm đánh giá</p>
        <p className="text-2xl font-semibold text-green-600">{percentage}%</p>
      </div>
      <div className="text-sm text-gray-600">
        <p>👍 {positive} tích cực</p>
        <p>👎 {negative} tiêu cực</p>
        <p className="text-gray-500">Tổng: {total}</p>
      </div>
    </div>
  );
}

function RatingsList({ ratings }) {
  if (!ratings || ratings.length === 0) {
    return <p className="text-sm text-gray-500">Chưa có đánh giá nào</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b bg-gray-50">
          <tr className="text-left">
            <th className="py-2 px-2">Ngày</th>
            <th className="py-2 px-2">Người đánh giá</th>
            <th className="py-2 px-2">Sản phẩm</th>
            <th className="py-2 px-2">Điểm</th>
            <th className="py-2 px-2">Nhận xét</th>
          </tr>
        </thead>
        <tbody>
          {ratings.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="py-2 px-2 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
              <td className="py-2 px-2">{maskUsername(r.reviewer_username) || 'Ẩn danh'}</td>
              <td className="py-2 px-2">{r.proname || '—'}</td>
              <td className="py-2 px-2">{r.score === 1 ? '👍' : '👎'}</td>
              <td className="py-2 px-2 text-gray-700">{r.comment || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState({ positive: 0, negative: 0, total: 0 });
  const [ratings, setRatings] = useState([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [sellerReq, setSellerReq] = useState(null);
  const [sellerReqLoading, setSellerReqLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/signin');
      return;
    }

    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [p, r, sreq] = await Promise.all([
          getProfile(),
          getRatings(),
          getSellerRequest()
        ]);
        if (!mounted) return;
        setProfile(p.user);
        setName(p.user?.name || '');
        setEmail(p.user?.email || '');
        setSummary(r.summary || { positive: 0, negative: 0, total: 0 });
        setRatings(r.ratings || []);
        setSellerReq(sreq.request || null);
      } catch (err) {
        console.error('Load profile error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, [isLoggedIn, navigate]);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    try {
      const res = await updateProfile({ name, email });
      alert(res.result_message || 'Cập nhật thành công');
      setProfile((prev) => ({ ...prev, name, email }));
    } catch (err) {
      console.error('Update profile error', err);
      alert(err.response?.data?.result_message || 'Lỗi cập nhật hồ sơ');
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    try {
      const res = await changePassword({ oldPassword, newPassword });
      alert(res.result_message || 'Đổi mật khẩu thành công');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      console.error('Change password error', err);
      alert(err.response?.data?.result_message || 'Lỗi đổi mật khẩu');
    }
  }

  async function handleSellerRequest() {
    try {
      setSellerReqLoading(true);
      const res = await createSellerRequest(7);
      alert(res.result_message || 'Đã gửi yêu cầu');
      setSellerReq(res.request || null);
    } catch (err) {
      console.error('Seller request error', err);
      alert(err.response?.data?.result_message || 'Lỗi khi gửi yêu cầu');
    } finally {
      setSellerReqLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Đang tải hồ sơ…</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Quản lý hồ sơ cá nhân</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Thông tin cá nhân</h2>
              <form className="space-y-4" onSubmit={handleUpdateProfile}>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Họ tên</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border rounded px-3 py-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tên đăng nhập</label>
                  <input className="w-full border rounded px-3 py-2 bg-gray-100" value={profile?.username || ''} disabled />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Lưu thay đổi
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Đổi mật khẩu</h2>
              <form className="space-y-4" onSubmit={handleChangePassword}>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Mật khẩu cũ</label>
                  <input
                    type="password"
                    className="w-full border rounded px-3 py-2"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Mật khẩu mới</label>
                  <input
                    type="password"
                    className="w-full border rounded px-3 py-2"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Đổi mật khẩu
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <RatingSummary summary={summary} />
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Chi tiết đánh giá</h3>
              <RatingsList ratings={ratings} />
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Xin được bán 7 ngày</h3>
              {profile?.role_id === 2 ? (
                <p className="text-sm text-green-600">Bạn đang là người bán.</p>
              ) : sellerReq?.status === 'pending' ? (
                <p className="text-sm text-blue-600">Yêu cầu đang chờ duyệt (gửi lúc {formatDateTime(sellerReq.created_at)}).</p>
              ) : sellerReq?.status === 'approved' ? (
                <p className="text-sm text-green-600">Đã được duyệt tới {sellerReq.expires_at ? formatDateTime(sellerReq.expires_at) : '—'}.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Gửi yêu cầu nâng cấp để được bán trong 7 ngày. Admin sẽ xem xét và duyệt.</p>
                  <button
                    onClick={handleSellerRequest}
                    disabled={sellerReqLoading}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {sellerReqLoading ? 'Đang gửi...' : 'Gửi yêu cầu' }
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
