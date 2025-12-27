import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Trophy, Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { handleView, ProductCard } from '@/services/product.service.jsx';
import axios from 'axios';

function formatPrice(v) {
  return new Intl.NumberFormat('vi-VN').format(v) + ' ₫';
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function MyBidsPage() {
  const navigate = useNavigate();
  const { isLoggedIn, isAuthReady, user } = useAuth();
  const [activeTab, setActiveTab] = useState('bidding'); // 'bidding' or 'won'
  const [biddingProducts, setBiddingProducts] = useState([]);
  const [wonProducts, setWonProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState(null); // { productId, sellerName }
  const [ratingScore, setRatingScore] = useState(null); // 1 or -1
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  
  // Pagination
  const [biddingPage, setBiddingPage] = useState(1);
  const [wonPage, setWonPage] = useState(1);
  const limit = 8;

  useEffect(() => {
    console.log('[MyBids] isAuthReady:', isAuthReady, 'isLoggedIn:', isLoggedIn, 'user:', user);
    
    // Wait for auth to be ready
    if (!isAuthReady) {
      console.log('[MyBids] Auth not ready, waiting...');
      return;
    }
    
    if (!isLoggedIn) {
      console.log('[MyBids] Not logged in, redirecting to signin');
      navigate('/signin');
      return;
    }
    
    loadData();
  }, [isAuthReady, isLoggedIn, navigate]);

  async function loadData() {
    setLoading(true);
    try {
      const [bidsRes, winsRes] = await Promise.all([
        axios.get('http://localhost:3000/api/bids/my-bids', { withCredentials: true }),
        axios.get('http://localhost:3000/api/bids/my-wins', { withCredentials: true })
      ]);

      if (bidsRes.data.result_code === 0) {
        setBiddingProducts(bidsRes.data.products || []);
      }

      if (winsRes.data.result_code === 0) {
        setWonProducts(winsRes.data.products || []);
      }
    } catch (error) {
      console.error('Load my bids error:', error);
      alert('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  async function handleRateSubmit(e) {
    e.preventDefault();

    if (ratingScore === null) {
      alert('Vui lòng chọn đánh giá');
      return;
    }

    setSubmittingRating(true);
    try {
      const response = await axios.post(
        'http://localhost:3000/api/bids/rate-seller',
        {
          productId: ratingModal.productId,
          score: ratingScore,
          comment: ratingComment
        },
        { withCredentials: true }
      );

      if (response.data.result_code === 0) {
        alert('Đánh giá thành công!');
        setRatingModal(null);
        setRatingScore(null);
        setRatingComment('');
        loadData(); // Reload to update rating status
      } else {
        alert(response.data.result_message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Rate seller error:', error);
      alert(error.response?.data?.result_message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingRating(false);
    }
  }

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-8 px-6 pb-28">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 bg-white rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentProducts = activeTab === 'bidding' ? biddingProducts : wonProducts;
  const currentPage = activeTab === 'bidding' ? biddingPage : wonPage;
  const setCurrentPage = activeTab === 'bidding' ? setBiddingPage : setWonPage;
  
  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = currentProducts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(currentProducts.length / limit);

  function changePage(p) {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6 pb-28">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Sản phẩm của tôi</h1>
          <div className="text-sm text-gray-600">{currentProducts.length} sản phẩm</div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 border">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab('bidding');
                setBiddingPage(1);
              }}
              className={`flex-1 py-4 px-6 font-medium transition flex items-center justify-center gap-2 ${
                activeTab === 'bidding'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Đang tham gia ({biddingProducts.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('won');
                setWonPage(1);
              }}
              className={`flex-1 py-4 px-6 font-medium transition flex items-center justify-center gap-2 ${
                activeTab === 'won'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Trophy className="w-5 h-5" />
              Đã thắng ({wonProducts.length})
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {paginatedProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border">
            <div className="text-gray-400 mb-4">
              {activeTab === 'bidding' ? (
                <TrendingUp className="w-16 h-16 mx-auto" />
              ) : (
                <Trophy className="w-16 h-16 mx-auto" />
              )}
            </div>
            <p className="text-gray-600 mb-4">
              {activeTab === 'bidding'
                ? 'Bạn chưa tham gia đấu giá sản phẩm nào'
                : 'Bạn chưa thắng sản phẩm nào'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Khám phá sản phẩm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedProducts.map((product) => {
              // If in "won" tab, all products are won by current user
              const isWonProduct = activeTab === 'won';
              const hasRated = product.my_rating !== null && product.my_rating !== undefined;

              return (
                <div key={product.proid} className="relative">
                  <ProductCard
                    p={product}
                    onView={(p) => handleView(p, navigate)}
                    onAdd={() => {}}
                    onAddToWatchlist={() => {}}
                  />
                  
                  {/* Badge/Button overlay for won products */}
                  {isWonProduct && (
                    <div className="absolute bottom-3 left-3 right-3">
                      {hasRated ? (
                        <div className="bg-green-500/90 text-white px-2 py-1 rounded text-xs flex items-center justify-center gap-1">
                          <Star className="w-3 h-3" />
                          Đã đánh giá
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRatingModal({
                              productId: product.proid,
                              productName: product.proname,
                              sellerName: product.seller_name
                            });
                          }}
                          className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition text-xs font-medium"
                        >
                          <Star className="w-3 h-3" />
                          Đánh giá
                        </button>
                      )}
                    </div>
                  )}

                  {activeTab === 'bidding' && product.my_highest_bid && (
                    <div className="absolute top-20 right-2 bg-blue-600/90 text-white px-2 py-1 rounded text-xs font-medium">
                      💰 {formatPrice(product.my_highest_bid)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Pagination */}
      {!loading && totalPages > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto py-3 flex justify-center items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => changePage(currentPage - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => changePage(p)}
                  className={`px-3 py-1 border rounded ${
                    p === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              disabled={currentPage === totalPages}
              onClick={() => changePage(currentPage + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-blue-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Star className="w-5 h-5" />
                Đánh giá người bán
              </h2>
            </div>

            <form onSubmit={handleRateSubmit} className="px-6 py-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Sản phẩm: <strong>{ratingModal.productName}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Người bán: <strong>{ratingModal.sellerName}</strong>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Đánh giá <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setRatingScore(1)}
                    className={`flex-1 py-3 px-4 rounded border-2 transition ${
                      ratingScore === 1
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    <ThumbsUp className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-sm font-medium">Tích cực</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingScore(-1)}
                    className={`flex-1 py-3 px-4 rounded border-2 transition ${
                      ratingScore === -1
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-red-400'
                    }`}
                  >
                    <ThumbsDown className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-sm font-medium">Tiêu cực</span>
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Nhận xét (tùy chọn)
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Chia sẻ trải nghiệm của bạn với người bán..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRatingModal(null);
                    setRatingScore(null);
                    setRatingComment('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingRating || ratingScore === null}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingRating ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
