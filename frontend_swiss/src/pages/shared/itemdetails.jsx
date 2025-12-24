import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductById, fetchRelatedProducts } from '@/services/product.service.jsx';

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

export default function ItemDetails() {
  const { proid } = useParams();   // ✅ ĐÚNG
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        const [p, r] = await Promise.all([
          fetchProductById(proid),
          fetchRelatedProducts(proid)
        ]);

        if (!mounted) return;
        setProduct(p);
        setRelated(r);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setProduct(null);
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
  created_at,
  end_time,
  seller,
  highest_bidder,
  qa_list = []
} = product;
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
            <h1 className="text-xl font-semibold">{proname}</h1>
            <p className="text-sm text-gray-500 mt-1">{tinydes}</p>

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

            <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
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
                <p>{highest_bidder.name}</p>
                <p className="text-xs text-gray-500">
                  ⭐ {highest_bidder.rating}/5
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">Chưa có</p>
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
    </div>
  );
}
