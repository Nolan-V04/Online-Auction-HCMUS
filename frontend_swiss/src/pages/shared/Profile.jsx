import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, changePassword, getRatings, getSellerRequest, createSellerRequest } from '@/services/profile.service.js';
import { useAuth } from '@/contexts/AuthContext';
import { ThumbsUp, ThumbsDown, Star, MessageSquare, Calendar, User } from 'lucide-react';

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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
        Điểm đánh giá
      </h3>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-4xl font-bold text-blue-600">{percentage}%</div>
          <div className="text-sm text-gray-600 mt-1">Tỷ lệ tích cực</div>
        </div>
        <div className="text-right space-y-1">
          <div className="flex items-center gap-2 text-green-600">
            <ThumbsUp className="w-4 h-4" />
            <span className="font-semibold">{positive}</span>
            <span className="text-sm text-gray-600">tích cực</span>
          </div>
          <div className="flex items-center gap-2 text-red-600">
            <ThumbsDown className="w-4 h-4" />
            <span className="font-semibold">{negative}</span>
            <span className="text-sm text-gray-600">tiêu cực</span>
          </div>
          <div className="text-sm text-gray-500 pt-1 border-t">
            Tổng: <span className="font-medium">{total}</span> đánh giá
          </div>
        </div>
      </div>
      {total > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

function RatingsList({ ratings }) {
  if (!ratings || ratings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Chưa có đánh giá nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {ratings.map((r) => (
        <div key={r.id} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">
                  {r.reviewer_name || maskUsername(r.reviewer_username) || 'Người dùng ẩn danh'}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {formatDateTime(r.created_at)}
                </div>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm ${
              r.score === 1 
                ? 'bg-gradient-to-r from-green-400 to-green-500 text-white' 
                : 'bg-gradient-to-r from-red-400 to-red-500 text-white'
            }`}>
              {r.score === 1 ? (
                <>
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Tích cực</span>
                </>
              ) : (
                <>
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Tiêu cực</span>
                </>
              )}
            </div>
          </div>

          {/* Product */}
          {r.proname && (
            <div className="bg-blue-50 border border-blue-100 rounded px-3 py-2 mb-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-gray-700">Sản phẩm:</span>
                <span className="text-blue-700 font-medium">{r.proname}</span>
              </div>
            </div>
          )}

          {/* Comment */}
          {r.comment ? (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-400 italic">Không có nhận xét</p>
            </div>
          )}
        </div>
      ))}
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

            
          </div>

          <div className="space-y-4">
            <RatingSummary summary={summary} />
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Chi tiết đánh giá
                <span className="ml-auto text-sm text-gray-500 font-normal">
                  {ratings.length} đánh giá
                </span>
              </h3>
              <RatingsList ratings={ratings} />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
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
