import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  Star, 
  MessageCircle,
  AlertCircle,
  X,
  Upload,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { fetchProductById } from '@/services/product.service.jsx';
import { useAuth } from '@/contexts/AuthContext';
import * as orderCompletionService from '@/services/orderCompletion.service.js';

function formatPrice(v) {
  return new Intl.NumberFormat('vi-VN').format(v) + ' ₫';
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('vi-VN');
}

export default function OrderCompletion() {
  const { proid } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [orderCompletion, setOrderCompletion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Step 1: Payment
  const [paymentProof, setPaymentProof] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  
  // Step 2: Shipping
  const [shippingInvoice, setShippingInvoice] = useState('');
  
  // Step 4: Rating
  const [rating, setRating] = useState(null);
  const [ratingComment, setRatingComment] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  // Cancellation
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadData();
  }, [proid, user]);

  useEffect(() => {
    if (orderCompletion) {
      loadChatMessages();
      // Poll for new messages every 5 seconds
      const interval = setInterval(loadChatMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [orderCompletion]);

  async function loadData() {
    if (!isLoggedIn) {
      navigate('/signin');
      return;
    }
    
    setLoading(true);
    try {
      const [productData, orderData] = await Promise.all([
        fetchProductById(proid),
        orderCompletionService.getOrderCompletionByProduct(proid)
      ]);
      
      console.log('Product data:', productData);
      console.log('Order completion data:', orderData);
      
      setProduct(productData);
      
      if (orderData.result_code === 0) {
        setOrderCompletion(orderData.order_completion);
        setIsSeller(orderData.is_seller);
        setIsWinner(orderData.is_winner);
        setUnreadCount(orderData.unread_count || 0);
        
        // Pre-fill existing data
        if (orderData.order_completion) {
          const oc = orderData.order_completion;
          if (oc.payment_proof) setPaymentProof(oc.payment_proof);
          if (oc.shipping_address) setShippingAddress(oc.shipping_address);
          if (oc.shipping_invoice) setShippingInvoice(oc.shipping_invoice);
        }
      } else {
        console.error('Order data error:', orderData);
        setError(orderData.result_message || 'Không thể tải thông tin đơn hàng');
      }
    } catch (err) {
      console.error('Error loading order completion:', err);
      setError(err.response?.data?.result_message || 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }

  async function loadChatMessages() {
    if (!orderCompletion) return;
    
    try {
      const res = await orderCompletionService.getChatMessages(orderCompletion.id);
      if (res.result_code === 0) {
        setChatMessages(res.messages);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error loading chat:', err);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      const res = await orderCompletionService.sendChatMessage(orderCompletion.id, newMessage);
      if (res.result_code === 0) {
        setNewMessage('');
        await loadChatMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Không thể gửi tin nhắn');
    }
  }

  async function handleSubmitPayment(e) {
    e.preventDefault();
    if (!paymentProof || !shippingAddress) {
      alert('Vui lòng cung cấp đầy đủ thông tin');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await orderCompletionService.submitPaymentInfo(
        orderCompletion.id,
        paymentProof,
        shippingAddress
      );
      
      if (res.result_code === 0) {
        alert('Đã gửi thông tin thanh toán thành công');
        await loadData();
      }
    } catch (err) {
      console.error('Error submitting payment:', err);
      alert('Không thể gửi thông tin thanh toán');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmShipping(e) {
    e.preventDefault();
    if (!shippingInvoice) {
      alert('Vui lòng cung cấp mã vận đơn');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await orderCompletionService.confirmShipping(
        orderCompletion.id,
        shippingInvoice
      );
      
      if (res.result_code === 0) {
        alert('Đã xác nhận gửi hàng thành công');
        await loadData();
      }
    } catch (err) {
      console.error('Error confirming shipping:', err);
      alert('Không thể xác nhận gửi hàng');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmReceived() {
    if (!confirm('Xác nhận đã nhận hàng?')) return;
    
    setSubmitting(true);
    try {
      const res = await orderCompletionService.confirmReceived(orderCompletion.id);
      
      if (res.result_code === 0) {
        alert('Đã xác nhận nhận hàng thành công');
        await loadData();
      }
    } catch (err) {
      console.error('Error confirming received:', err);
      alert('Không thể xác nhận nhận hàng');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitRating() {
    if (rating === null) {
      alert('Vui lòng chọn đánh giá');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await orderCompletionService.submitRating(
        orderCompletion.id,
        rating,
        ratingComment
      );
      
      if (res.result_code === 0) {
        alert('Đã gửi đánh giá thành công');
        setShowRatingModal(false);
        await loadData();
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelTransaction() {
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy');
      return;
    }
    
    if (!confirm('Bạn có chắc muốn hủy giao dịch? Người mua sẽ nhận đánh giá -1.')) {
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await orderCompletionService.cancelTransaction(
        orderCompletion.id,
        cancelReason
      );
      
      if (res.result_code === 0) {
        alert('Đã hủy giao dịch');
        setShowCancelModal(false);
        await loadData();
      }
    } catch (err) {
      console.error('Error cancelling transaction:', err);
      alert('Không thể hủy giao dịch');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    );
  }

  if (!orderCompletion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="text-xl mb-4">Không tìm thấy thông tin đơn hàng</div>
          {product && (
            <div className="text-gray-600 text-sm">
              <p>Sản phẩm: {product.proname}</p>
              <p>Người thắng: {product.highest_bidder ? `User #${product.highest_bidder}` : 'Chưa có'}</p>
              <p>Trạng thái: {product.end_time && new Date(product.end_time) > new Date() ? 'Đang đấu giá' : 'Đã kết thúc'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentStep = orderCompletion.current_step;
  const status = orderCompletion.status;
  const isCancelled = status === 'cancelled';
  const isCompleted = status === 'completed';
  
  const steps = [
    { number: 1, title: 'Thanh toán', icon: CreditCard },
    { number: 2, title: 'Vận chuyển', icon: Truck },
    { number: 3, title: 'Nhận hàng', icon: Package },
    { number: 4, title: 'Đánh giá', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">Hoàn tất đơn hàng</h1>
              <h2 className="text-lg text-gray-700 mb-2">{product.proname}</h2>
              <div className="text-sm text-gray-600">
                <p>Giá cuối: <span className="font-semibold text-green-600">{formatPrice(orderCompletion.final_price || product.price)}</span></p>
                <p>Người bán: <span className="font-semibold">{orderCompletion.seller_name}</span></p>
                <p>Người mua: <span className="font-semibold">{orderCompletion.buyer_name}</span></p>
              </div>
            </div>
            
            {/* Chat button */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="relative flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <MessageCircle size={20} />
              <span>Chat</span>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          
          {/* Status banner */}
          {isCancelled && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle size={20} />
                <span className="font-semibold">Giao dịch đã bị hủy</span>
              </div>
              <p className="text-sm text-red-700 mt-1">Lý do: {orderCompletion.cancellation_reason}</p>
              <p className="text-sm text-red-700">Hủy lúc: {formatDate(orderCompletion.cancelled_at)}</p>
            </div>
          )}
          
          {isCompleted && (
            <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle size={20} />
                <span className="font-semibold">Giao dịch hoàn tất</span>
              </div>
            </div>
          )}
        </div>

        {/* Progress steps */}
        {!isCancelled && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isComplete = currentStep > step.number;
                
                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center mb-2
                        ${isComplete ? 'bg-green-500 text-white' : ''}
                        ${isActive ? 'bg-blue-500 text-white' : ''}
                        ${!isActive && !isComplete ? 'bg-gray-300 text-gray-600' : ''}
                      `}>
                        <Icon size={24} />
                      </div>
                      <span className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                        {step.title}
                      </span>
                    </div>
                    
                    {idx < steps.length - 1 && (
                      <div className={`h-1 flex-1 mx-2 ${isComplete ? 'bg-green-500' : 'bg-gray-300'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6">
          {/* Step 1: Payment (Buyer) */}
          {currentStep === 1 && isWinner && !isCancelled && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="text-blue-600" />
                Bước 1: Cung cấp thông tin thanh toán
              </h3>
              
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Hóa đơn thanh toán (URL hoặc mô tả) *
                  </label>
                  <textarea
                    value={paymentProof}
                    onChange={(e) => setPaymentProof(e.target.value)}
                    className="w-full border rounded-lg p-3 min-h-[100px]"
                    placeholder="Nhập link ảnh hoặc mô tả chi tiết về việc thanh toán..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Địa chỉ giao hàng *
                  </label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full border rounded-lg p-3 min-h-[100px]"
                    placeholder="Nhập địa chỉ nhận hàng đầy đủ..."
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi thông tin thanh toán'}
                </button>
              </form>
            </div>
          )}
          
          {/* Show payment info to seller */}
          {currentStep >= 2 && isSeller && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-600" />
                Thông tin thanh toán từ người mua
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Hóa đơn thanh toán:</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded">{orderCompletion.payment_proof}</p>
                </div>
                <div>
                  <span className="font-medium">Địa chỉ giao hàng:</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded">{orderCompletion.shipping_address}</p>
                </div>
                <div className="text-gray-600">
                  Gửi lúc: {formatDate(orderCompletion.payment_submitted_at)}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Shipping (Seller) */}
          {currentStep === 2 && isSeller && !isCancelled && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Truck className="text-blue-600" />
                Bước 2: Xác nhận đã nhận tiền và gửi hàng
              </h3>
              
              <form onSubmit={handleConfirmShipping} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mã vận đơn / Thông tin vận chuyển *
                  </label>
                  <textarea
                    value={shippingInvoice}
                    onChange={(e) => setShippingInvoice(e.target.value)}
                    className="w-full border rounded-lg p-3 min-h-[100px]"
                    placeholder="Nhập mã vận đơn hoặc thông tin giao hàng..."
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitting ? 'Đang xác nhận...' : 'Xác nhận đã gửi hàng'}
                </button>
              </form>
            </div>
          )}
          
          {/* Show shipping info to buyer */}
          {currentStep >= 3 && isWinner && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-600" />
                Thông tin vận chuyển
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Mã vận đơn:</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded">{orderCompletion.shipping_invoice}</p>
                </div>
                <div className="text-gray-600">
                  Gửi hàng lúc: {formatDate(orderCompletion.shipping_confirmed_at)}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirm received (Buyer) */}
          {currentStep === 3 && isWinner && !isCancelled && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="text-blue-600" />
                Bước 3: Xác nhận đã nhận hàng
              </h3>
              
              <p className="text-gray-700 mb-4">
                Vui lòng xác nhận khi bạn đã nhận được hàng và kiểm tra sản phẩm.
              </p>
              
              <button
                onClick={handleConfirmReceived}
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitting ? 'Đang xác nhận...' : 'Xác nhận đã nhận hàng'}
              </button>
            </div>
          )}
          
          {/* Show received confirmation */}
          {currentStep >= 4 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-600" />
                Đã nhận hàng
              </h3>
              
              <p className="text-sm text-gray-600">
                Xác nhận lúc: {formatDate(orderCompletion.goods_received_at)}
              </p>
            </div>
          )}

          {/* Step 4: Rating */}
          {currentStep >= 4 && !isCancelled && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Star className="text-blue-600" />
                Bước 4: Đánh giá giao dịch
              </h3>
              
              {/* Show current rating */}
              {((isSeller && orderCompletion.seller_rating) || (isWinner && orderCompletion.buyer_rating)) ? (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium mb-2">Đánh giá của bạn:</p>
                  <div className="flex items-center gap-2 mb-2">
                    {(isSeller ? orderCompletion.seller_rating : orderCompletion.buyer_rating) === 1 ? (
                      <><ThumbsUp className="text-green-600" size={24} /> <span className="text-green-600 font-semibold">Tích cực</span></>
                    ) : (
                      <><ThumbsDown className="text-red-600" size={24} /> <span className="text-red-600 font-semibold">Tiêu cực</span></>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">
                    {isSeller ? orderCompletion.seller_rating_comment : orderCompletion.buyer_rating_comment}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Đánh giá lúc: {formatDate(isSeller ? orderCompletion.seller_rated_at : orderCompletion.buyer_rated_at)}
                  </p>
                </div>
              ) : null}
              
              <button
                onClick={() => {
                  setShowRatingModal(true);
                  // Pre-fill existing rating if any
                  if (isSeller && orderCompletion.seller_rating) {
                    setRating(orderCompletion.seller_rating);
                    setRatingComment(orderCompletion.seller_rating_comment || '');
                  } else if (isWinner && orderCompletion.buyer_rating) {
                    setRating(orderCompletion.buyer_rating);
                    setRatingComment(orderCompletion.buyer_rating_comment || '');
                  }
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
              >
                {((isSeller && orderCompletion.seller_rating) || (isWinner && orderCompletion.buyer_rating)) 
                  ? 'Thay đổi đánh giá' 
                  : 'Đánh giá ngay'}
              </button>
            </div>
          )}

          {/* Seller cancel button */}
          {isSeller && !isCancelled && !isCompleted && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-3 text-red-600">Hủy giao dịch</h3>
              <p className="text-sm text-gray-600 mb-4">
                Bạn có thể hủy giao dịch bất kỳ lúc nào. Người mua sẽ nhận đánh giá -1.
              </p>
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700"
              >
                Hủy giao dịch
              </button>
            </div>
          )}
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">Chat với {isSeller ? 'người mua' : 'người bán'}</h3>
              <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs mt-1 opacity-70">{formatDate(msg.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 border rounded-lg px-3 py-2"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Gửi
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rating modal */}
        {showRatingModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Đánh giá giao dịch</h3>
                <button onClick={() => setShowRatingModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Đánh giá</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setRating(1)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 ${
                        rating === 1 ? 'border-green-600 bg-green-50 text-green-600' : 'border-gray-300'
                      }`}
                    >
                      <ThumbsUp size={24} />
                      <span className="font-semibold">Tích cực</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setRating(-1)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 ${
                        rating === -1 ? 'border-red-600 bg-red-50 text-red-600' : 'border-gray-300'
                      }`}
                    >
                      <ThumbsDown size={24} />
                      <span className="font-semibold">Tiêu cực</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block font-medium mb-2">Nhận xét (tùy chọn)</label>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full border rounded-lg p-3 min-h-[100px]"
                    placeholder="Nhập nhận xét ngắn về giao dịch..."
                  />
                </div>
                
                <button
                  onClick={handleSubmitRating}
                  disabled={submitting || rating === null}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-red-600">Hủy giao dịch</h3>
                <button onClick={() => setShowCancelModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700">
                  Bạn có chắc muốn hủy giao dịch này? Người mua sẽ nhận đánh giá -1.
                </p>
                
                <div>
                  <label className="block font-medium mb-2">Lý do hủy *</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border rounded-lg p-3 min-h-[100px]"
                    placeholder="Nhập lý do hủy giao dịch..."
                    required
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
                  >
                    Quay lại
                  </button>
                  
                  <button
                    onClick={handleCancelTransaction}
                    disabled={submitting || !cancelReason.trim()}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                  >
                    {submitting ? 'Đang hủy...' : 'Xác nhận hủy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
