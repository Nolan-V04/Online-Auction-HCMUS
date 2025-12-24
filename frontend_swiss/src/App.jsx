import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutGrid, Info, Activity, ArrowRight } from 'lucide-react';
import { fetchTopEnding, fetchTopBids, fetchTopPrice } from '@/services/product.service.jsx';
import { handleView, formatPrice, timeLeftLabel, ProductCard } from './services/product.service.jsx';
import { useAuth } from '@/contexts/AuthContext';
import { addToWatchlist } from '@/services/watchlist.service.js';


export function Section({ title, products, onView, onAdd, onAddToWatchlist, loading }) {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-56 bg-white rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((p) => (
            <ProductCard key={p.proid} p={p} onView={onView} onAdd={onAdd} onAddToWatchlist={onAddToWatchlist} />
          ))}
        </div>
      )}
    </section>
  );
}

function App() {
  const [ending, setEnding] = useState([]);
  const [bids, setBids] = useState([]);
  const [price, setPrice] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const [endingData, bidsData, priceData] = await Promise.all([
          fetchTopEnding().catch(() => sampleProducts),
          fetchTopBids().catch(() => sampleProducts),
          fetchTopPrice().catch(() => sampleProducts),
        ]);

        if (!mounted) return;
        setEnding((endingData || sampleProducts).slice(0, 5));
        setBids((bidsData || sampleProducts).slice(0, 5));
        setPrice((priceData || sampleProducts).slice(0, 5));
      } catch (err) {
        if (!mounted) return;
        setEnding(sampleProducts.slice(0, 5));
        setBids(sampleProducts.slice(0, 5));
        setPrice(sampleProducts.slice(0, 5));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, []);

  function handleAdd(p) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((c) => c.proid === p.proid);
    if (existing) existing.qty = (existing.qty || 1) + 1;
    else cart.push({ proid: p.proid, proname: p.proname, price: p.price, qty: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${p.proname} added to cart`);
  }

  async function handleAddToWatchlist(p) {
    // If logged in, use API
    if (isLoggedIn) {
      try {
        const res = await addToWatchlist(p.proid);
        if (res.result_code === 0) {
          alert(`Đã thêm ${p.proname} vào danh sách yêu thích`);
        } else if (res.result_code === -1 && res.result_message.includes('Vui lòng')) {
          alert(res.result_message);
        } else {
          alert(`${p.proname} đã có trong danh sách yêu thích`);
        }
      } catch (err) {
        console.error('Add to watchlist error', err);
        alert('Lỗi khi thêm vào danh sách yêu thích');
      }
      return;
    }

    // Fallback to localStorage for guests
    const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
    const existing = watchlist.find((item) => item.proid === p.proid);

    if (existing) {
      alert(`${p.proname} đã có trong danh sách yêu thích`);
      return;
    }

    watchlist.push({
      proid: p.proid,
      proname: p.proname,
      price: p.price,
      end_time: p.end_time || p.endtime || p.endTime,
      created_at: p.created_at
    });

    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    alert(`Đã thêm ${p.proname} vào danh sách yêu thích`);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Sections */}
        <div className="space-y-8">
          <Section title="Top 5: Sản phẩm gần kết thúc" products={ending} onView={handleView} onAdd={handleAdd} onAddToWatchlist={handleAddToWatchlist} loading={loading} />
          <Section title="Top 5: Sản phẩm nhiều lượt ra giá nhất" products={bids} onView={handleView} onAdd={handleAdd} onAddToWatchlist={handleAddToWatchlist} loading={loading} />
          <Section title="Top 5: Sản phẩm có giá cao nhất" products={price} onView={handleView} onAdd={handleAdd} onAddToWatchlist={handleAddToWatchlist} loading={loading} />
        </div>
      </div>
    </div>
  );
}

export default App;
