import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { fetchProductById, fetchRelatedProducts } from '@/services/product.service.jsx';
import { useAuth } from '@/contexts/AuthContext';
import { addToWatchlist } from '@/services/watchlist.service.js';
import { getBidHistory } from '@/services/bid.service.js';
import BidModal from '@/components/BidModal';

function formatPrice(v) {
  return new Intl.NumberFormat('vi-VN').format(v) + ' ₫';
}

function relativeTime(endTime) {
  if (!endTime) return '';
  const diff = new Date(endTime) - new Date();
  if (diff <= 0) return 'Đã kết thúc';

  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút nữa`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ nữa`;

  const days = Math.floor(hrs / 24);
  return `${days} ngày nữa`;
}

function maskUsername(username) {
  if (!username) return '****';
  if (username.length <= 2) return '****';
  return '****' + username.slice(-Math.min(4, username.length));
}

export default function ItemDetails() {
  const { proid } = useParams();   // ✅ ĐÚNG
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        const [p, r, bh] = await Promise.all([
          fetchProductById(proid),
          fetchRelatedProducts(proid),
          getBidHistory(proid).catch(() => ({ bids: [] }))
        ]);

        if (!mounted) return;
        setProduct(p);
        setRelated(r);
        setBidHistory(bh.bids || []);
      } catch (err) {
        console.error('Error fetching product details:', err);
        if (mounted) setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, [proid]);

  if (loading) return <div className="p-10 text-center">Đang tải…</div>;
  if (!product) return <div className="p-10 text-center">Không tìm thấy sản phẩm</div>;

  const {
  proid: pid,
  proname,
  tinydes,
  fulldes,
  price,
  buy_now_price,
  bid_count,
  bid_step,
  created_at,
  end_time,
  seller,
  highest_bidder,
  highest_bidder_username,
  qa_list = []
} = product;

  async function handleAddToWatchlist() {
    // If logged in, use API
    if (isLoggedIn) {
      try {
        const res = await addToWatchlist(proid);
        if (res.result_code === 0) {
          setIsInWatchlist(true);
          alert(`Đã thêm ${proname} vào danh sách yêu thích`);
        } else if (res.result_code === -1 && res.result_message.includes('Vui lòng')) {
          alert(res.result_message);
        } else {
          alert(`${proname} đã có trong danh sách yêu thích`);
        }
      } catch (err) {
        console.error('Add to watchlist error', err);
        alert('Lỗi khi thêm vào danh sách yêu thích');
      }
      return;
    }

    // Fallback to localStorage for guests
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    const existing = watchlist.find((item) => item.proid === parseInt(proid));

    if (existing) {
      alert(`${proname} đã có trong danh sách yêu thích`);
      return;
    }

    watchlist.push({
      proid: parseInt(proid),
      proname,
      price,
      end_time,
      created_at
    });

    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    setIsInWatchlist(true);
    alert(`Đã thêm ${proname} vào danh sách yêu thích`);
  }

  async function handleBidSuccess(data) {
    // Reload product to get updated price
    setProduct(prev => ({
      ...prev,
      price: data.new_price,
      bid_count: (prev.bid_count || 0) + 1
    }));
    
    // Refresh bid history
    try {
      const bh = await getBidHistory(proid);
      setBidHistory(bh.bids || []);
    } catch (err) {
      console.error('Error refreshing bid history:', err);
    }
    
    alert('Đặt giá thành công!');
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* IMAGES */}
          <div className="bg-white rounded shadow p-4">
            <img
              src={`/static/imgs/products/${proid}/main.jpg`}
              className="w-full h-[420px] object-cover rounded"
              alt={proname}
              onError={(e) => { e.target.src = '/vite.svg'; }}
            />

            <div className="grid grid-cols-4 gap-3 mt-4">
              {[1, 2, 3].map((i) => (
                <img
                  key={i}
                  src={`/static/imgs/products/${proid}/${i}.jpg`}
                  className="h-24 w-full object-cover rounded border"
                  alt="thumb"
                  onError={(e) => { e.target.src = '/vite.svg'; }}
                />
              ))}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="bg-white rounded shadow p-6">
            <h2 className="font-semibold text-lg mb-2">Mô tả chi tiết</h2>
            <p className="text-gray-700 whitespace-pre-line">{fulldes}</p>
          </div>

          {/* Q&A */}
          <div className="bg-white rounded shadow p-6">
            <h2 className="font-semibold text-lg mb-4">Hỏi & Đáp</h2>

            {qa_list.length === 0 && (
              <p className="text-sm text-gray-500">Chưa có câu hỏi</p>
            )}

            <div className="space-y-4">
              {qa_list.map((qa, idx) => (
                <div key={idx} className="border-b pb-3">
                  <p className="text-sm">
                        <b>{qa.asked_by}</b>: {qa.question}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(qa.asked_at).toLocaleString()}
                  </p>

                  {qa.answer && (
                    <div className="mt-2 ml-4 text-sm text-green-700">
                        <b>Người bán:</b> {qa.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          {/* INFO */}
          <div className="bg-white rounded shadow p-6">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h1 className="text-xl font-semibold">{proname}</h1>
                <p className="text-sm text-gray-500 mt-1">{tinydes}</p>
              </div>
              <button
                onClick={handleAddToWatchlist}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition"
                title="Thêm vào danh sách yêu thích"
              >
                <Heart 
                  className={`w-6 h-6 ${
                    isInWatchlist 
                      ? 'text-red-500 fill-red-500' 
                      : 'text-gray-600 hover:text-red-500'
                  }`} 
                />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Giá hiện tại</span>
                <span className="text-red-600 font-semibold">
                  {formatPrice(price)}
                </span>
              </div>

              {buy_now_price && (
                <div className="flex justify-between">
                  <span>Giá mua ngay</span>
                  <span className="text-green-600 font-semibold">
                    {formatPrice(buy_now_price)}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Số lượt đấu giá</span>
                <span>{bid_count}</span>
              </div>

              <div className="flex justify-between">
                <span>Ngày đăng</span>
                <span>{new Date(created_at).toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Kết thúc</span>
                <span>{relativeTime(end_time)}</span>
              </div>
            </div>

            <button 
              onClick={() => {
                if (!isLoggedIn) {
                  alert('Vui lòng đăng nhập để đặt giá');
                  navigate('/signin');
                  return;
                }
                setBidModalOpen(true);
              }}
              className="w-full mt-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Đặt giá
            </button>
          </div>

          {/* SELLER */}
          <div className="bg-white rounded shadow p-6">
            <h3 className="font-semibold">Người bán</h3>
            {seller ? (
              <>
                <p>{seller.name}</p>
                <p className="text-xs text-gray-500">⭐ {seller.rating}/5</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Không có thông tin</p>
            )}
          </div>

          {/* HIGHEST BIDDER */}
          <div className="bg-white rounded shadow p-6">
            <h3 className="font-semibold">Người đấu cao nhất</h3>
            {highest_bidder ? (
              <>
                <p>{maskUsername(highest_bidder_username) || highest_bidder}</p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Chưa có</p>
            )}
          </div>

          {/* BID HISTORY */}
          <div className="bg-white rounded shadow p-6">
            <h3 className="font-semibold mb-4">Lịch sử đấu giá</h3>

            {bidHistory.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có lượt đấu giá</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="pb-2">Thời điểm</th>
                      <th className="pb-2">Người mua</th>
                      <th className="pb-2 text-right">Giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bidHistory.map((bid) => (
                      <tr key={bid.bidid} className="border-b last:border-0">
                        <td className="py-2">
                          {new Date(bid.bid_time).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-2">{maskUsername(bid.username)}</td>
                        <td className="py-2 text-right font-semibold text-red-600">
                          {formatPrice(bid.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RELATED */}
      <div className="max-w-7xl mx-auto mt-12">
        <h2 className="font-semibold mb-4">Sản phẩm cùng chuyên mục</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {related.map((p) => (
            <div
              key={p.proid}
              onClick={() => navigate(`/products/detail/${p.proid}`)}
              className="bg-white rounded shadow cursor-pointer hover:shadow-md"
            >
              <img
                src={`/static/imgs/products/${p.proid}/main.jpg`}
                className="h-32 w-full object-cover rounded-t"
                alt={p.proname}
                onError={(e) => { e.target.src = '/vite.svg'; }}
              />
              <div className="p-2">
                <p className="text-sm truncate">{p.proname}</p>
                <p className="text-xs text-red-600 font-semibold">
                  {formatPrice(p.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bid Modal */}
      <BidModal
        isOpen={bidModalOpen}
        onClose={() => setBidModalOpen(false)}
        productId={proid}
        productName={proname}
        onBidSuccess={handleBidSuccess}
      />
    </div>
  );
}
