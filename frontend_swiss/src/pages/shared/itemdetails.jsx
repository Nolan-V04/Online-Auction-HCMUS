import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Edit, X, Trash2, Upload, AlertCircle } from 'lucide-react';
import { fetchProductById, fetchRelatedProducts } from '@/services/product.service.jsx';
import { useAuth } from '@/contexts/AuthContext';
import { addToWatchlist } from '@/services/watchlist.service.js';
import { getBidHistory, buyNow } from '@/services/bid.service.js';
import { updateAuctionProduct, deleteAuctionProduct, uploadImages } from '@/services/seller.service.js';
import { fetchCategories } from '@/services/category.service.jsx';
import BidModal from '@/components/BidModal';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import axios from 'axios';

// Helper function to clean HTML content
const cleanHtmlContent = (html) => {
  if (!html) return '';
  // Replace literal \n with actual line breaks
  return html.replace(/\\n/g, '<br />');
};

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
  const { isLoggedIn, user } = useAuth();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [additionalDescription, setAdditionalDescription] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showBuyNowConfirm, setShowBuyNowConfirm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    proname: '',
    tinydes: '',
    fulldes: '',
    starting_price: '',
    bid_step: '100000',
    buy_now_price: '',
    auto_extend: false,
    catid: '',
    end_time: '',
    images: []
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });
  const [questionText, setQuestionText] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [answeringQid, setAnsweringQid] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [permissionRequests, setPermissionRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        const [p, r, bh, cats] = await Promise.all([
          fetchProductById(proid),
          fetchRelatedProducts(proid),
          getBidHistory(proid).catch(() => ({ bids: [] })),
          fetchCategories()
        ]);

        if (!mounted) return;
        
        // Check if auction has ended and redirect to order completion if user is seller or winner
        if (p.end_time && new Date(p.end_time) <= new Date() && user) {
          const isSeller = p.seller_id === user.id;
          const isWinner = p.highest_bidder === user.id;
          
          if (isSeller || isWinner) {
            navigate(`/order-completion/${proid}`);
            return;
          }
        }
        
        setProduct(p);
        setRelated(r);
        setBidHistory(bh.bids || []);
        setCategories(cats.categories || cats || []);
        
        // Set first image as selected
        if (p.images && p.images.length > 0) {
          setSelectedImage(`http://localhost:3000${p.images[0]}`);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        if (mounted) setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, [proid, user]);

  // Load permission requests when user or product changes and user is owner
  useEffect(() => {
    if (product && user && product.seller_id === user.id) {
      loadPermissionRequests();
    }
  }, [product, user]);

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
  seller_id,
  seller_name,
  seller_email,
  seller_positive_ratings,
  seller_negative_ratings,
  seller_total_ratings,
  highest_bidder,
  highest_bidder_username,
  highest_bidder_positive_ratings,
  highest_bidder_negative_ratings,
  highest_bidder_total_ratings,
  qa_list = []
} = product;

  // Calculate seller rating percentage
  const sellerRatingPercentage = seller_total_ratings > 0 
    ? ((seller_positive_ratings / seller_total_ratings) * 100).toFixed(1)
    : null;

  // Calculate highest bidder rating percentage
  const bidderRatingPercentage = highest_bidder_total_ratings > 0 
    ? ((highest_bidder_positive_ratings / highest_bidder_total_ratings) * 100).toFixed(1)
    : null;

  // Check if current user is the seller
  const isOwner = user && seller_id && user.id === seller_id;
  
  // Check if auction has ended
  const auctionEnded = end_time && new Date(end_time) <= new Date();

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
    // Reload full product data to get updated info
    try {
      const [updatedProduct, bh] = await Promise.all([
        fetchProductById(proid),
        getBidHistory(proid)
      ]);
      
      setProduct(updatedProduct);
      setBidHistory(bh.bids || []);
      
      // Update selected image if needed
      if (updatedProduct.images && updatedProduct.images.length > 0 && !selectedImage) {
        setSelectedImage(`http://localhost:3000${updatedProduct.images[0]}`);
      }
      
      alert('Đặt giá thành công!');
    } catch (err) {
      console.error('Error refreshing product data:', err);
      // Fallback to partial update
      setProduct(prev => ({
        ...prev,
        price: data.new_price,
        bid_count: (prev.bid_count || 0) + 1
      }));
      alert('Đặt giá thành công!');
    }
  }

  async function handleBuyNow() {
    if (!isLoggedIn) {
      alert('Vui lòng đăng nhập để mua sản phẩm');
      navigate('/signin');
      return;
    }

    if (!buy_now_price) {
      alert('Sản phẩm này không có giá mua ngay. Vui lòng tham gia đấu giá để mua sản phẩm.');
      return;
    }

    setShowBuyNowConfirm(true);
  }

  async function confirmBuyNow() {
    setShowBuyNowConfirm(false);
    setBuyingNow(true);
    try {
      const res = await buyNow(proid);
      if (res.result_code === 0) {
        alert(res.result_message);
        // Reload product to show updated status
        const updatedProduct = await fetchProductById(proid);
        setProduct(updatedProduct);
        const bh = await getBidHistory(proid);
        setBidHistory(bh.bids || []);
      } else {
        alert(res.result_message || 'Không thể mua sản phẩm');
      }
    } catch (err) {
      console.error('Buy now error:', err);
      alert('Lỗi khi mua sản phẩm');
    } finally {
      setBuyingNow(false);
    }
  }

  async function handleAppendDescription() {
    if (!additionalDescription.trim()) {
      alert('Vui lòng nhập nội dung mô tả');
      return;
    }

    setSavingDescription(true);
    try {
      const response = await axios.patch(
        `http://localhost:3000/api/products/${proid}/append-description`,
        { additionalDescription },
        { 
          withCredentials: true,
          headers: { 'apiKey': '12345ABCDE' }
        }
      );

      if (response.data.result_code === 0) {
        // Reload product to get updated description
        const updatedProduct = await fetchProductById(proid);
        setProduct(updatedProduct);
        setAdditionalDescription('');
        setIsEditingDescription(false);
        alert('Đã cập nhật mô tả thành công!');
      } else {
        alert(response.data.result_message || 'Lỗi khi cập nhật mô tả');
      }
    } catch (err) {
      console.error('Error appending description:', err);
      alert('Lỗi khi cập nhật mô tả');
    } finally {
      setSavingDescription(false);
    }
  }

  const handleEditClick = () => {
    setFormData({
      proname: product.proname || '',
      tinydes: product.tinydes || '',
      fulldes: '', // Empty for additional description
      starting_price: product.starting_price || '',
      bid_step: product.bid_step || '100000',
      buy_now_price: product.buy_now_price || '',
      auto_extend: product.auto_extend || false,
      catid: product.catid || '',
      end_time: product.end_time ? new Date(product.end_time).toISOString().slice(0, 16) : '',
      images: product.images || []
    });
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDescriptionChange = (value) => {
    setFormData(prev => ({ ...prev, fulldes: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploadingImages(true);
      const res = await uploadImages(files);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...res.imageUrls]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      setErrorModal({ show: true, message: 'Không thể upload ảnh' });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.images.length < 3) {
      setErrorModal({ show: true, message: 'Vui lòng upload tối thiểu 3 ảnh (1 ảnh chính + 2 ảnh phụ)' });
      return;
    }

    try {
      // Update basic product info (without fulldes)
      const updateData = {
        proname: formData.proname,
        tinydes: formData.tinydes,
        starting_price: formData.starting_price,
        bid_step: formData.bid_step,
        buy_now_price: formData.buy_now_price,
        auto_extend: formData.auto_extend,
        catid: formData.catid,
        end_time: formData.end_time,
        images: formData.images
      };
      
      await updateAuctionProduct(product.proid, updateData);
      
      // If there's additional description, append it with timestamp
      if (formData.fulldes && formData.fulldes.trim()) {
        await axios.patch(
          `http://localhost:3000/api/products/${product.proid}/append-description`,
          { additionalDescription: formData.fulldes },
          { 
            withCredentials: true,
            headers: { 'apiKey': '12345ABCDE' }
          }
        );
      }
      
      setShowEditModal(false);
      
      // Reload product
      const updatedProduct = await fetchProductById(proid);
      setProduct(updatedProduct);
      if (updatedProduct.images && updatedProduct.images.length > 0) {
        setSelectedImage(`http://localhost:3000${updatedProduct.images[0]}`);
      }
      
      alert('Cập nhật sản phẩm thành công!');
    } catch (error) {
      console.error('Error updating product:', error);
      setErrorModal({ show: true, message: error.response?.data?.result_message || 'Không thể cập nhật sản phẩm' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAuctionProduct(product.proid);
      alert('Đã xóa sản phẩm thành công!');
      navigate('/seller/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrorModal({ show: true, message: error.response?.data?.result_message || 'Không thể xóa sản phẩm' });
      setShowDeleteConfirm(false);
    }
  };

  const getCategoriesHierarchy = () => {
    const parentCategories = categories.filter(cat => !cat.parent_id);
    const result = [];
    
    parentCategories.forEach(parent => {
      result.push({ ...parent, isParent: true });
      const children = categories.filter(cat => cat.parent_id === parent.catid);
      children.forEach(child => {
        result.push({ ...child, isChild: true });
      });
    });
    
    return result;
  };

  const handleRejectBidder = async () => {
    try {
      const response = await axios.post(
        `http://localhost:3000/api/products/${proid}/reject-bidder`,
        { bidderId: highest_bidder },
        { 
          withCredentials: true,
          headers: { 'apiKey': '12345ABCDE' }
        }
      );

      if (response.data.result_code === 0) {
        setShowRejectConfirm(false);
        // Reload product to get updated info
        const updatedProduct = await fetchProductById(proid);
        setProduct(updatedProduct);
        setErrorModal({ show: true, message: 'Đã từ chối người mua thành công!' });
      } else {
        setErrorModal({ show: true, message: response.data.result_message || 'Lỗi khi từ chối người mua' });
      }
    } catch (err) {
      console.error('Error rejecting bidder:', err);
      setErrorModal({ show: true, message: 'Lỗi khi từ chối người mua' });
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setSubmittingQuestion(true);
    try {
      const response = await axios.post(
        `http://localhost:3000/api/products/${proid}/questions`,
        { question: questionText },
        { 
          withCredentials: true,
          headers: { 'apiKey': '12345ABCDE' }
        }
      );

      if (response.data.result_code === 0) {
        setQuestionText('');
        // Reload product to get updated questions
        const updatedProduct = await fetchProductById(proid);
        setProduct(updatedProduct);
        setErrorModal({ show: true, message: 'Đã gửi câu hỏi thành công! Người bán sẽ nhận được email thông báo.' });
      } else {
        setErrorModal({ show: true, message: response.data.result_message || 'Lỗi khi gửi câu hỏi' });
      }
    } catch (err) {
      console.error('Error submitting question:', err);
      if (err.response?.status === 401) {
        setErrorModal({ show: true, message: 'Vui lòng đăng nhập để đặt câu hỏi' });
      } else {
        setErrorModal({ show: true, message: 'Lỗi khi gửi câu hỏi' });
      }
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleSubmitAnswer = async (qid) => {
    if (!answerText.trim()) return;

    setSubmittingAnswer(true);
    try {
      const response = await axios.patch(
        `http://localhost:3000/api/products/${proid}/questions/${qid}/answer`,
        { answer: answerText },
        { 
          withCredentials: true,
          headers: { 'apiKey': '12345ABCDE' }
        }
      );

      if (response.data.result_code === 0) {
        setAnswerText('');
        setAnsweringQid(null);
        // Reload product to get updated questions
        const updatedProduct = await fetchProductById(proid);
        setProduct(updatedProduct);
        setErrorModal({ show: true, message: 'Đã trả lời câu hỏi thành công!' });
      } else {
        setErrorModal({ show: true, message: response.data.result_message || 'Lỗi khi trả lời câu hỏi' });
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setErrorModal({ show: true, message: 'Lỗi khi trả lời câu hỏi' });
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const loadPermissionRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await axios.get(
        `http://localhost:3000/api/products/${proid}/bid-permission-requests`,
        { 
          withCredentials: true,
          headers: { 'apiKey': '12345ABCDE' }
        }
      );

      if (response.data.result_code === 0) {
        setPermissionRequests(response.data.requests || []);
      }
    } catch (err) {
      console.error('Error loading permission requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handlePermissionAction = async (requestId, action) => {
    try {
      const response = await axios.patch(
        `http://localhost:3000/api/products/${proid}/bid-permission-requests/${requestId}`,
        { action },
        { 
          withCredentials: true,
          headers: { 'apiKey': '12345ABCDE' }
        }
      );

      if (response.data.result_code === 0) {
        setErrorModal({ show: true, message: response.data.result_message });
        // Reload permission requests
        loadPermissionRequests();
      } else {
        setErrorModal({ show: true, message: response.data.result_message });
      }
    } catch (err) {
      console.error('Error handling permission action:', err);
      setErrorModal({ show: true, message: 'Lỗi khi xử lý yêu cầu' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* Auction Ended Banner for non-seller/winner */}
          {auctionEnded && (!user || (user.id !== seller_id && user.id !== highest_bidder)) && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-yellow-800 text-xl font-bold mb-2">
                <AlertCircle size={24} />
                <span>Sản phẩm đã kết thúc</span>
              </div>
              <p className="text-yellow-700">
                Phiên đấu giá đã kết thúc. Chỉ người bán và người thắng cuộc có thể xem chi tiết hoàn tất đơn hàng.
              </p>
            </div>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <div className="bg-white rounded shadow p-4">
              <div className="flex gap-3">
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa sản phẩm
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa sản phẩm
                </button>
              </div>
            </div>
          )}

          {/* IMAGES */}
          <div className="bg-white rounded shadow p-4">
            {/* Main Image */}
            <div className="mb-4">
              <img
                src={selectedImage || `/static/imgs/products/${proid}/main.jpg`}
                className="w-full h-[420px] object-cover rounded"
                alt={proname}
                onError={(e) => { e.target.src = '/vite.svg'; }}
              />
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 0 ? (
              <div className="grid grid-cols-6 gap-3">
                {product.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={`http://localhost:3000${img}`}
                    className={`h-20 w-full object-cover rounded border-2 cursor-pointer transition-all ${
                      selectedImage === `http://localhost:3000${img}` 
                        ? 'border-blue-500 ring-2 ring-blue-300' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                    alt={`Ảnh ${idx + 1}`}
                    onClick={() => setSelectedImage(`http://localhost:3000${img}`)}
                    onError={(e) => { e.target.src = '/vite.svg'; }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
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
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="bg-white rounded shadow p-6">
            <h2 className="font-semibold text-lg mb-4">Mô tả chi tiết</h2>
            <div className="text-gray-700 ql-editor" dangerouslySetInnerHTML={{ __html: cleanHtmlContent(fulldes) }} />
          </div>

          {/* Q&A */}
          <div className="bg-white rounded shadow p-6">
            <h2 className="font-semibold text-lg mb-4">Hỏi & Đáp</h2>

            {/* Question Form */}
            {isLoggedIn && !isOwner && (
              <form onSubmit={handleSubmitQuestion} className="mb-6 border border-blue-200 rounded-lg p-4 bg-blue-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đặt câu hỏi cho người bán
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Nhập câu hỏi của bạn về sản phẩm này..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                  disabled={submittingQuestion}
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    Người bán sẽ nhận được email thông báo và có thể trả lời câu hỏi của bạn
                  </p>
                  <button
                    type="submit"
                    disabled={submittingQuestion || !questionText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    {submittingQuestion ? 'Đang gửi...' : 'Gửi câu hỏi'}
                  </button>
                </div>
              </form>
            )}

            {!isLoggedIn && (
              <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50 text-center">
                <p className="text-sm text-gray-600">
                  <a href="/signin" className="text-blue-600 hover:underline">Đăng nhập</a> để đặt câu hỏi cho người bán
                </p>
              </div>
            )}

            {/* Questions List */}
            {qa_list.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có câu hỏi nào</p>
            ) : (
              <div className="space-y-4">
                {qa_list.map((qa) => (
                  <div key={qa.qid} className="border-b pb-4 last:border-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm">
                          <b className="text-blue-600">{qa.asker_name}</b>: {qa.question}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(qa.asked_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    {qa.answer ? (
                      <div className="mt-2 ml-4 p-3 bg-green-50 rounded border-l-4 border-green-500">
                        <p className="text-sm text-green-900">
                          <b>Người bán:</b> {qa.answer}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(qa.answered_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    ) : isOwner && answeringQid === qa.qid ? (
                      <div className="mt-2 ml-4">
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Nhập câu trả lời..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                          rows="3"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleSubmitAnswer(qa.qid)}
                            disabled={submittingAnswer || !answerText.trim()}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 transition"
                          >
                            {submittingAnswer ? 'Đang gửi...' : 'Gửi trả lời'}
                          </button>
                          <button
                            onClick={() => {
                              setAnsweringQid(null);
                              setAnswerText('');
                            }}
                            className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : isOwner ? (
                      <div className="mt-2 ml-4">
                        <button
                          onClick={() => setAnsweringQid(qa.qid)}
                          className="text-sm text-green-600 hover:underline"
                        >
                          Trả lời câu hỏi này
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 ml-4">
                        <p className="text-xs text-gray-400 italic">Chưa có câu trả lời</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          {/* INFO */}
          <div className="bg-white rounded shadow p-6 overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0 overflow-hidden">
                <h1 className="text-xl font-semibold break-words">{proname}</h1>
                <div 
                  className="text-sm text-gray-500 mt-1 break-words" 
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  dangerouslySetInnerHTML={{ __html: cleanHtmlContent(tinydes) }} 
                />
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

              {buy_now_price && (
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-semibold text-green-600">Giá mua ngay</span>
                  <span className="font-bold text-green-600">{formatPrice(buy_now_price)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 mt-4">
              <button 
                onClick={() => {
                  if (!isLoggedIn) {
                    alert('Vui lòng đăng nhập để đặt giá');
                    navigate('/signin');
                    return;
                  }
                  setBidModalOpen(true);
                }}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Đặt giá
              </button>

              <button 
                onClick={handleBuyNow}
                disabled={buyingNow || !buy_now_price}
                className={`w-full py-2 rounded transition ${
                  !buy_now_price 
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                } ${buyingNow ? 'opacity-50 cursor-wait' : ''}`}
                title={!buy_now_price ? 'Sản phẩm này không có giá mua ngay. Vui lòng tham gia đấu giá.' : 'Mua ngay với giá cố định'}
              >
                {buyingNow ? 'Đang xử lý...' : (buy_now_price ? 'Mua ngay' : 'Chỉ có thể đấu giá')}
              </button>
            </div>
          </div>

          {/* SELLER */}
          <div className="bg-white rounded shadow p-6">
            <h3 className="font-semibold mb-3">Người bán</h3>
            {seller_name || seller ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Tên:</span>
                  <span className="font-medium">{seller_name || seller?.name || 'N/A'}</span>
                </div>
                {seller_email && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm text-blue-600">{seller_email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Đánh giá:</span>
                  {sellerRatingPercentage !== null ? (
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-green-600">{sellerRatingPercentage}%</span>
                      <span className="text-xs text-gray-500">
                        ({seller_positive_ratings}+ / {seller_negative_ratings}-)
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Chưa có đánh giá</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Không có thông tin</p>
            )}
          </div>

          {/* HIGHEST BIDDER */}
          <div className="bg-white rounded shadow p-6">
            <h3 className="font-semibold mb-3">Người đấu cao nhất</h3>
            {highest_bidder ? (
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Tên: </span>
                  <span className="font-medium">{maskUsername(highest_bidder_username) || highest_bidder}</span>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Đánh giá: </span>
                  {bidderRatingPercentage !== null ? (
                    <div className="inline-flex items-center gap-1">
                      <span className="font-medium text-green-600">{bidderRatingPercentage}%</span>
                      <span className="text-xs text-gray-500">
                        ({highest_bidder_positive_ratings}+ / {highest_bidder_negative_ratings}-)
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Chưa có đánh giá</span>
                  )}
                </div>

                {isOwner && (
                  <div className="pt-3 border-t flex gap-2">
                    <button
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                      onClick={() => alert('Chức năng đồng ý sẽ được thêm sau')}
                    >
                      Đồng ý
                    </button>
                    <button
                      onClick={() => setShowRejectConfirm(true)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                    >
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
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

          {/* BID PERMISSION REQUESTS (Seller Only) */}
          {isOwner && (
            <div className="bg-white rounded shadow p-6">
              <h2 className="font-semibold text-lg mb-4">Yêu cầu xin phép đấu giá</h2>

              {loadingRequests ? (
                <p className="text-sm text-gray-500">Đang tải...</p>
              ) : permissionRequests.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có yêu cầu nào</p>
              ) : (
                <div className="space-y-4">
                  {permissionRequests.map((request) => {
                    const ratingPercentage = request.bidder_total_ratings > 0
                      ? ((request.bidder_positive_ratings / request.bidder_total_ratings) * 100).toFixed(1)
                      : '0.0';
                    
                    return (
                      <div key={request.request_id} className={`border rounded-lg p-4 ${
                        request.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                        request.status === 'approved' ? 'bg-green-50 border-green-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-gray-900">{request.bidder_name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                request.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                                request.status === 'approved' ? 'bg-green-200 text-green-800' :
                                'bg-red-200 text-red-800'
                              }`}>
                                {request.status === 'pending' ? 'Chờ xét duyệt' :
                                 request.status === 'approved' ? 'Đã chấp nhận' : 'Đã từ chối'}
                              </span>
                            </div>
                            
                            <div className="text-sm space-y-1">
                              {request.bidder_email && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Email:</span> {request.bidder_email}
                                </p>
                              )}
                              <p className="text-gray-600">
                                <span className="font-medium">Đánh giá:</span>{' '}
                                <span className={`${
                                  parseFloat(ratingPercentage) >= 80 ? 'text-green-600' : 'text-red-600'
                                } font-medium`}>
                                  {ratingPercentage}%
                                </span>
                                {' '}({request.bidder_positive_ratings}+ / {request.bidder_negative_ratings}-)
                              </p>
                              <p className="text-xs text-gray-500">
                                Yêu cầu lúc: {new Date(request.requested_at).toLocaleString('vi-VN')}
                              </p>
                              {request.reviewed_at && (
                                <p className="text-xs text-gray-500">
                                  Xét duyệt lúc: {new Date(request.reviewed_at).toLocaleString('vi-VN')}
                                </p>
                              )}
                            </div>
                          </div>

                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handlePermissionAction(request.request_id, 'approve')}
                                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                              >
                                Chấp nhận
                              </button>
                              <button
                                onClick={() => handlePermissionAction(request.request_id, 'reject')}
                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                              >
                                Từ chối
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0] my-auto">
            <div className="bg-[#3B82F6] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Chỉnh sửa sản phẩm
              </h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="px-6 py-6 space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-2">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    name="proname"
                    value={formData.proname}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-2">
                    Mô tả ngắn *
                  </label>
                  <input
                    type="text"
                    name="tinydes"
                    value={formData.tinydes}
                    onChange={handleFormChange}
                    required
                    maxLength={100}
                    className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* Images Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-2">
                    Hình ảnh * (Tối thiểu 3 ảnh: 1 ảnh chính + 2 ảnh phụ)
                  </label>
                  <div className="border-2 border-dashed border-[#E2E8F0] rounded-lg p-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                      className="hidden"
                      id="imageUploadEdit"
                    />
                    <label 
                      htmlFor="imageUploadEdit"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      {uploadingImages ? (
                        <p className="text-[#64748B]">Đang upload...</p>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-[#64748B] mb-2" />
                          <p className="text-[#64748B] text-sm">Nhấn để chọn ảnh</p>
                          <p className="text-[#94A3B8] text-xs mt-1">Ảnh đầu tiên sẽ là ảnh chính</p>
                        </>
                      )}
                    </label>
                    
                    {formData.images.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-[#64748B] mb-2">
                          Đã có {formData.images.length} ảnh {formData.images.length < 3 && `(còn thiếu ${3 - formData.images.length})`}
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          {formData.images.map((img, index) => (
                            <div key={index} className="relative">
                              <img 
                                src={`http://localhost:3000${img}`} 
                                alt={`Product ${index + 1}`} 
                                className="w-full h-32 object-cover rounded" 
                              />
                              {index === 0 && (
                                <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded">
                                  Ảnh chính
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-2">
                    Danh mục *
                  </label>
                  <select
                    name="catid"
                    value={formData.catid}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {getCategoriesHierarchy().map(cat => (
                      <option 
                        key={cat.catid} 
                        value={cat.catid}
                        style={{ fontWeight: cat.isParent ? 'bold' : 'normal' }}
                      >
                        {cat.isChild ? '\u00a0\u00a0\u00a0\u00a0└─ ' : ''}{cat.catname}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#475569] mb-2">
                      Giá khởi điểm (VNĐ) *
                    </label>
                    <input
                      type="number"
                      name="starting_price"
                      value={formData.starting_price}
                      onChange={handleFormChange}
                      required
                      min="0"
                      className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#475569] mb-2">
                      Bước giá (VNĐ) *
                    </label>
                    <input
                      type="number"
                      name="bid_step"
                      value={formData.bid_step}
                      onChange={handleFormChange}
                      required
                      min="0"
                      className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#475569] mb-2">
                      Giá mua ngay (VNĐ)
                    </label>
                    <input
                      type="number"
                      name="buy_now_price"
                      value={formData.buy_now_price}
                      onChange={handleFormChange}
                      min="0"
                      className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    />
                  </div>
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-2">
                    Thời gian kết thúc *
                  </label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>

                {/* Auto Extend */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="auto_extend"
                    checked={formData.auto_extend}
                    onChange={handleFormChange}
                    className="w-4 h-4 text-[#3B82F6] border-gray-300 rounded focus:ring-[#3B82F6]"
                  />
                  <label className="text-sm text-[#475569]">
                    Tự động gia hạn (khi có lượt đấu mới trước 5 phút kết thúc, tự động gia hạn thêm 10 phút)
                  </label>
                </div>

                {/* Full Description */}
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-2">
                    Mô tả chi tiết hiện tại
                  </label>
                  <div 
                    className="bg-gray-50 border border-[#E2E8F0] rounded-lg p-4 max-h-60 overflow-y-auto mb-4 ql-editor"
                    dangerouslySetInnerHTML={{ __html: cleanHtmlContent(product.fulldes || '') }}
                  />
                  
                  <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Lưu ý:</strong> Nội dung mới sẽ được thêm vào cuối mô tả hiện tại, không thay thế mô tả cũ. Mỗi lần cập nhật sẽ có dấu thời gian.
                    </p>
                  </div>
                  
                  <label className="block text-sm font-medium text-[#475569] mb-2">
                    Nội dung bổ sung
                  </label>
                  <ReactQuill
                    theme="snow"
                    value={formData.fulldes}
                    onChange={handleDescriptionChange}
                    className="bg-white"
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                      ]
                    }}
                    style={{ height: '200px', marginBottom: '60px' }}
                    placeholder="Nhập nội dung bổ sung cho mô tả..."
                  />
                </div>
              </div>

              <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all shadow-md"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-blue-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Xác nhận xóa
              </h2>
            </div>
            <div className="px-6 py-6">
              <p className="text-[#475569]">
                Bạn có chắc chắn muốn xóa sản phẩm "<strong>{product.proname}</strong>" không?
              </p>
              <p className="text-sm text-red-600 mt-2">
                Hành động này không thể hoàn tác!
              </p>
            </div>
            <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 bg-blue-600 hover:bg-red-700 text-white font-medium transition-all shadow-md"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Now Confirmation Modal */}
      {showBuyNowConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-blue-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Xác nhận mua ngay
              </h2>
            </div>
            <div className="px-6 py-6">
              <p className="text-[#475569] mb-4">
                Bạn có chắc chắn muốn mua sản phẩm "<strong>{proname}</strong>" không?
              </p>
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Giá mua ngay:</span>
                  <span className="text-xl font-bold text-green-600">{formatPrice(buy_now_price)}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Sau khi mua ngay, đấu giá sẽ kết thúc và bạn sẽ là người thắng cuộc.
              </p>
            </div>
            <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowBuyNowConfirm(false)}
                disabled={buyingNow}
                className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmBuyNow}
                disabled={buyingNow}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium transition-all shadow-md disabled:opacity-50"
              >
                {buyingNow ? 'Đang xử lý...' : 'Xác nhận mua'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Bidder Confirmation Modal */}
      {showRejectConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <X className="w-5 h-5" />
                Xác nhận từ chối
              </h2>
              <button
                onClick={() => setShowRejectConfirm(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <p className="text-[#475569]">
                Bạn có chắc chắn muốn từ chối người mua <strong>{maskUsername(highest_bidder_username)}</strong> không?
              </p>
              
              {bidderRatingPercentage !== null && (
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <p className="text-sm text-gray-600 mb-1">Thông tin người mua:</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Đánh giá:</span>
                    <span className="font-medium text-green-600">{bidderRatingPercentage}%</span>
                    <span className="text-xs text-gray-500">
                      ({highest_bidder_positive_ratings}+ / {highest_bidder_negative_ratings}-)
                    </span>
                  </div>
                </div>
              )}
              
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-800">
                  <strong>Lưu ý:</strong>
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Người này sẽ không thể đấu giá sản phẩm này nữa</li>
                  <li>Nếu đây là người đấu cao nhất, sản phẩm sẽ chuyển cho người đấu cao thứ hai</li>
                  <li>Hành động này không thể hoàn tác!</li>
                </ul>
              </div>
            </div>
            <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRejectConfirm(false)}
                className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectBidder}
                className="px-5 py-2.5 bg-blue-600 hover:bg-red-700 text-white font-medium transition-all shadow-md"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Thông báo</h2>
              <button
                onClick={() => setErrorModal({ show: false, message: "" })}
                className="text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="text-[#475569]">{errorModal.message}</p>
            </div>
            <div className="bg-[#F8FAFC] px-6 py-4 flex justify-end">
              <button
                onClick={() => setErrorModal({ show: false, message: "" })}
                className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
