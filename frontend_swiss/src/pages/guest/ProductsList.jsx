import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchProducts } from '@/services/product.service.jsx';
import { fetchCategoryById } from '@/services/category.service.jsx';

import { handleView, formatPrice, timeLeftLabel, ProductCard } from '@/services/product.service.jsx';


export default function ProductsList() {
  const location = useLocation();
  const qs = new URLSearchParams(location.search);

  const catid = qs.get('catid');
  const pageFromUrl = parseInt(qs.get('page') || '1', 10);

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(pageFromUrl);
  const [loading, setLoading] = useState(true);
  const [catName, setCatName] = useState('');

  const limit = 8;
  const totalPages = Math.ceil(total / limit);

  /* ===== Reset page when catid changes ===== */
  useEffect(() => {
    setPage(1);

    const params = new URLSearchParams();
    if (catid) params.set('catid', catid);
    params.set('page', 1);

    window.history.pushState(
      {},
      '',
      `${location.pathname}?${params.toString()}`
    );
  }, [catid]);

  /* ===== Load products ===== */
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetchProducts({ catid, page, limit });
        if (!mounted) return;

        setProducts(res.products || []);
        setTotal(res.total || 0);

        if (catid) {
          try {
            const c = await fetchCategoryById(catid);
            if (c?.record) setCatName(c.record.catname || '');
          } catch {
            setCatName('');
          }
        } else {
          setCatName('Tất cả');
        }
      } catch (err) {
        console.error('ProductsList load error', err);
        setProducts([]);
        setTotal(0);
        setCatName('');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [catid, page]);

  /* ===== Pagination ===== */
  function changePage(p) {
    if (p < 1 || p > totalPages) return;

    setPage(p);

    const params = new URLSearchParams();
    if (catid) params.set('catid', catid);
    params.set('page', p);

    window.history.pushState(
      {},
      '',
      `${location.pathname}?${params.toString()}`
    );

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  function handleAdd(p) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((c) => c.proid === p.proid);

    if (existing) existing.qty = (existing.qty || 1) + 1;
    else cart.push({ proid: p.proid, proname: p.proname, price: p.price, qty: 1 });

    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${p.proname} added to cart`);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6 pb-28">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">
            {catName ? `Danh mục: ${catName}` : 'Sản phẩm'}
          </h1>
          <div className="text-sm text-gray-600">{total} sản phẩm</div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-56 bg-white rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard
                key={p.proid}
                p={p}
                onView={handleView}
                onAdd={handleAdd}
              />
            ))}
          </div>
        )}
      </div>
      {/* ===== FIXED PAGINATION ===== */}
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
