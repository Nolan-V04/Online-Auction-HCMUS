import { useEffect, useState } from 'react';
import { getWatchlistProducts } from '@/services/watchlist.service.js';
import { handleView, ProductCard } from '@/services/product.service.jsx';
import { removeFromWatchlist } from '@/services/watchlist.service.js';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function WatchlistPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const limit = 8;
  const totalPages = Math.ceil(total / limit);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/signin');
    }
  }, [isLoggedIn, navigate]);

  // Load watchlist products
  useEffect(() => {
    if (!isLoggedIn) return;

    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await getWatchlistProducts(page, limit);
        if (!mounted) return;

        if (res.result_code === 0) {
          setProducts(res.products || []);
          setTotal(res.total || 0);
        } else {
          setProducts([]);
          setTotal(0);
        }
      } catch (err) {
        console.error('WatchlistPage load error', err);
        if (mounted) {
          setProducts([]);
          setTotal(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [page, isLoggedIn]);

  // Pagination
  function changePage(p) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Handle remove from watchlist
  async function handleRemove(p) {
    try {
      const res = await removeFromWatchlist(p.proid);
      if (res.result_code === 0) {
        // Reload current page
        const res = await getWatchlistProducts(page, limit);
        if (res.result_code === 0) {
          setProducts(res.products || []);
          setTotal(res.total || 0);
        }
      }
    } catch (err) {
      console.error('Remove from watchlist error', err);
      alert('Lỗi khi xóa khỏi danh sách yêu thích');
    }
  }

  function handleAdd(p) {
    alert('Chức năng đặt giá đang được phát triển');
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6 pb-28">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Danh sách yêu thích</h1>
          <div className="text-sm text-gray-600">{total} sản phẩm</div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-56 bg-white rounded-lg animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-2">Danh sách yêu thích trống</div>
            <div className="text-gray-500 text-sm">Thêm sản phẩm bạn quan tâm vào danh sách yêu thích</div>
            <button
              onClick={() => navigate('/')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Khám phá sản phẩm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div key={p.proid} className="relative">
                <ProductCard
                  p={p}
                  onView={handleView}
                  onAdd={handleAdd}
                  onAddToWatchlist={handleRemove}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(p);
                  }}
                  className="absolute bottom-3 right-3 bg-red-100 text-red-600 px-3 py-1 rounded text-xs hover:bg-red-200"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FIXED PAGINATION */}
      {!loading && totalPages > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white">
          <div className="max-w-7xl mx-auto py-3 flex justify-center items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => changePage(page - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
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
                    p === page
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              disabled={page === totalPages}
              onClick={() => changePage(page + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
