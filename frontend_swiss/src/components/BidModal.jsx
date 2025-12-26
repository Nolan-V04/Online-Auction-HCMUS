import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { getBidInfo, placeBid } from '@/services/bid.service.js';
import axios from 'axios';

function formatPrice(v) {
  return new Intl.NumberFormat('vi-VN').format(v) + ' ₫';
}

export default function BidModal({ isOpen, onClose, productId, productName, onBidSuccess }) {
  const [loading, setLoading] = useState(true);
  const [bidInfo, setBidInfo] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState('');

  useEffect(() => {
    if (isOpen && productId) {
      loadBidInfo();
    }
  }, [isOpen, productId]);

  async function loadBidInfo() {
    setLoading(true);
    setError('');
    try {
      const data = await getBidInfo(productId);
      if (data.result_code === 0) {
        setBidInfo(data);
        setBidAmount(data.suggested_bid.toString());
      } else {
        setError(data.result_message);
      }
    } catch (err) {
      setError('Không thể tải thông tin đấu giá');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Vui lòng nhập giá hợp lệ');
      return;
    }

    if (amount < bidInfo.suggested_bid) {
      setError(`Giá đấu phải ít nhất ${formatPrice(bidInfo.suggested_bid)}`);
      return;
    }

    setSubmitting(true);
    try {
      const data = await placeBid(productId, amount);
      if (data.result_code === 0) {
        onBidSuccess && onBidSuccess(data);
        onClose();
      } else {
        setError(data.result_message);
      }
    } catch (err) {
      setError('Lỗi khi đặt giá');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestPermission() {
    setRequestingPermission(true);
    setPermissionMessage('');
    try {
      const response = await axios.post(
        `http://localhost:3000/api/products/${productId}/request-bid-permission`,
        {},
        { 
          withCredentials: true,
          headers: { 'apiKey': '12345ABCDE' }
        }
      );

      if (response.data.result_code === 0) {
        setPermissionMessage(response.data.result_message);
      } else {
        setError(response.data.result_message);
      }
    } catch (err) {
      setError('Lỗi khi gửi yêu cầu xin phép');
    } finally {
      setRequestingPermission(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between bg-blue-500 p-4 border-b">
          <h2 className="text-lg font-semibold text-white">Đặt giá đấu</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : error && !bidInfo ? (
            <div className="bg-red-50 border border-red-200 rounded p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          ) : bidInfo ? (
            <>
              {/* Product Info */}
              <div className="bg-gray-50 rounded p-3">
                <div className="text-sm font-medium mb-2">{productName}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Giá hiện tại:</span>
                    <div className="font-semibold text-red-600">
                      {formatPrice(bidInfo.current_price)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Bước giá:</span>
                    <div className="font-semibold">
                      {formatPrice(bidInfo.bid_step)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating Info */}
              <div className={`border rounded p-3 ${
                bidInfo.eligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-2">
                  {bidInfo.eligible ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      bidInfo.eligible ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {bidInfo.reason}
                    </div>
                    {bidInfo.rating_info.total > 0 && (
                      <div className="text-xs mt-1 text-gray-600">
                        Đánh giá: {bidInfo.rating_info.positive}+ / {bidInfo.rating_info.negative}- 
                        ({bidInfo.rating_info.percentage?.toFixed(1)}%)
                      </div>
                    )}
                    {bidInfo.rating_info.total === 0 && (
                      <div className="text-xs mt-1 text-gray-600">
                        Chưa có đánh giá
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bid Form */}
              {bidInfo.eligible && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Giá đấu của bạn
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full border rounded px-3 py-2 pr-8"
                        placeholder={bidInfo.suggested_bid}
                        min={bidInfo.suggested_bid}
                        step={bidInfo.bid_step}
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        ₫
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <TrendingUp className="w-3 h-3" />
                      Đề xuất: {formatPrice(bidInfo.suggested_bid)}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                      disabled={submitting}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      disabled={submitting}
                    >
                      {submitting ? 'Đang xử lý...' : 'Xác nhận đặt giá'}
                    </button>
                  </div>
                </form>
              )}

              {/* Request Permission Button for ineligible bidders */}
              {!bidInfo.eligible && (
                <div className="space-y-4">
                  {permissionMessage ? (
                    <div className="bg-green-50 border border-green-200 rounded p-4 flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-800">{permissionMessage}</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="font-medium text-yellow-800 mb-2">Bạn chưa đủ điều kiện để đấu giá</p>
                        <p>Bạn có thể gửi yêu cầu xin phép người bán để được tham gia đấu giá sản phẩm này. Người bán sẽ nhận được email thông báo và xem xét yêu cầu của bạn.</p>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                          {error}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleRequestPermission}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          disabled={requestingPermission}
                        >
                          {requestingPermission ? 'Đang gửi...' : 'Xin phép người bán'}
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Đóng
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
