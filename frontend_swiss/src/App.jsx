import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutGrid, Info, Activity, ArrowRight } from 'lucide-react';
import { fetchTopEnding, fetchTopBids, fetchTopPrice } from '@/services/product.service.jsx';

function formatPrice(v) {
  return new Intl.NumberFormat('vi-VN').format(v) + ' ₫';
}

function timeLeftLabel(endTime) {
  if (!endTime) return null;
  const end = new Date(endTime);
  const diff = end - new Date();
  if (diff <= 0) return 'Ended';
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hrs >= 24) return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function ProductCard({ p, onView, onAdd }) {
  const tl = timeLeftLabel(p.end_time || p.endtime || p.endTime);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden relative">
      {tl && (
        <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded text-xs font-medium text-gray-800">{tl}</div>
      )}
      {p.bid_count !== undefined && (
        <div className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded text-xs font-medium text-gray-800">{p.bid_count} bids</div>
      )}
      <div className="h-44 bg-gray-100 flex items-center justify-center">
        <img
          src={`/static/imgs/sp/${p.proid}/main_thumbs.jpg`}
          alt={p.proname}
          className="object-cover h-full w-full"
          onError={(e) => { e.target.src = '/vite.svg'; }}
        />
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-[#1E293B] truncate">{p.proname}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.tinydes || p.proname}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-red-600 font-semibold">{formatPrice(p.price)}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => onView(p)} className="text-sm text-blue-600">View details</button>
            <button onClick={() => onAdd(p)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Add to cart</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, products, onView, onAdd, loading }) {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link to="#" className="text-sm text-blue-600">See all</Link>
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
            <ProductCard key={p.proid} p={p} onView={onView} onAdd={onAdd} />
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

  function handleView(p) {
    // Use server-rendered detail page
    window.location.href = `/products/detail/${p.proid}`;
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
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Sections */}
        <div className="space-y-8">
          <Section title="Top 5: Sản phẩm gần kết thúc" products={ending} onView={handleView} onAdd={handleAdd} loading={loading} />
          <Section title="Top 5: Sản phẩm nhiều lượt ra giá nhất" products={bids} onView={handleView} onAdd={handleAdd} loading={loading} />
          <Section title="Top 5: Sản phẩm có giá cao nhất" products={price} onView={handleView} onAdd={handleAdd} loading={loading} />
        </div>
      </div>
    </div>
  );
}

export default App;
