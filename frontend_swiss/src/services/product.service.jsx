import axios from "axios";
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const instance = axios.create({
  baseURL: 'http://localhost:3000/api/',
  timeout: 20000,
  headers: { 'apiKey': '12345ABCDE' }
});

export async function fetchTopEnding() { 
    return (await instance.get('/products/top-ending')).data.products; 
}

export async function fetchTopBids()   { 
    return (await instance.get('/products/top-bids')).data.products; 
}

export async function fetchTopPrice()  { 
    return (await instance.get('/products/top-price')).data.products; 
}

export async function fetchProducts({ catid, page = 1, limit = 8 } = {}) {
  const res = await instance.get('/products', {
    params: { catid, page, limit }
  });
  if (res.status === 200) return res.data;
  throw new Error('Failed to fetch products');
}

export async function fetchProductById(proid) {
  if (!proid) {
    throw new Error('Product id is required');
  }

  const res = await instance.get(`/products/detail/${proid}`);
  return res.data.product;
}

export async function fetchRelatedProducts(proid) {
  if (!proid) {
    throw new Error('Product id is required');
  }

  const res = await instance.get(`/products/related/${proid}`);
  return res.data.products || [];
}


export async function handleView(p) {
    window.location.href = `/products/detail/${p.proid}`;
}

export function formatPrice(v) {
  return new Intl.NumberFormat('vi-VN').format(v) + ' ₫';
}

export function timeLeftLabel(endTime) {
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

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN');
}


export function ProductCard({ p, onView, onAdd }) {
  const timeLeft = timeLeftLabel(p.end_time || p.endtime || p.endTime);

  const handleCardClick = () => {
    onView(p);
  };

  return (
    <div
      onClick={handleCardClick}
      className="cursor-pointer bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden relative hover:shadow-md transition"
    >
      {/* Thời gian còn lại */}
      {timeLeft && (
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-medium">
          ⏳ {timeLeft}
        </div>
      )}

      {/* Số lượt ra giá */}
      {typeof p.bid_count === 'number' && (
        <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-medium">
          🔨 {p.bid_count} bids
        </div>
      )}

      {/* Ảnh */}
      <div className="h-44 bg-gray-100">
        <img
          src={`/static/imgs/sp/${p.proid}/main_thumbs.jpg`}
          alt={p.proname}
          className="object-cover h-full w-full"
          onError={(e) => { e.target.src = '/vite.svg'; }}
        />
      </div>

      {/* Nội dung */}
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-semibold truncate">{p.proname}</h3>

        <div className="text-xs text-gray-500">
          Đăng ngày: {formatDate(p.created_at)}
        </div>

        <div className="text-red-600 font-semibold text-base">
          {formatPrice(p.price)}
        </div>

        <div className="text-xs text-gray-600">
          Cao nhất:{' '}
          <span className="font-medium">
            {p.highest_bidder || 'Chưa có'}
          </span>
        </div>

        {p.buy_now_price && (
          <div className="text-xs text-green-600 font-medium">
            Mua ngay: {formatPrice(p.buy_now_price)}
          </div>
        )}

        {/* ACTION */}
        <div className="pt-2 flex justify-between items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(p);
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Xem chi tiết
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd(p);
            }}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Đặt giá
          </button>
        </div>
      </div>
    </div>
  );
}