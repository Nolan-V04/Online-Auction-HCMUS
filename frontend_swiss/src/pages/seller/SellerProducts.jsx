import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, X, Upload, Star, ThumbsUp, ThumbsDown, MessageSquare, XCircle } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useAuth } from '@/contexts/AuthContext';
import { handleView, ProductCard } from '@/services/product.service.jsx';
import { 
  getSellerProducts, 
  createAuctionProduct, 
  updateAuctionProduct, 
  deleteAuctionProduct,
  uploadImages,
  rateWinner,
  cancelTransaction
} from '@/services/seller.service.js';
import { fetchCategories } from '@/services/category.service.jsx';

export default function SellerProducts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'ended'
  
  // Rating modal state
  const [ratingModal, setRatingModal] = useState({ show: false, product: null });
  const [ratingScore, setRatingScore] = useState(null);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  
  const limit = 8;
  const totalPages = Math.ceil(total / limit);
  
  const [formData, setFormData] = useState({
    proname: '',
    tinydes: '',
    fulldes: '',
    starting_price: '',
    bid_step: '',
    buy_now_price: '',
    auto_extend: false,
    catid: '',
    end_time: '',
    images: []
  });

  useEffect(() => {
    loadData();
  }, [page, activeTab]);

  async function loadData() {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        getSellerProducts(),
        fetchCategories()
      ]);
      const allProducts = productsRes.products || [];
      
      // Filter by tab
      const now = new Date();
      const filtered = activeTab === 'active' 
        ? allProducts.filter(p => new Date(p.end_time) > now)
        : allProducts.filter(p => new Date(p.end_time) <= now && p.highest_bidder);
      
      setTotal(filtered.length);
      
      // Manual pagination
      const start = (page - 1) * limit;
      const end = start + limit;
      setProducts(filtered.slice(start, end));
      
      setCategories(categoriesRes.categories || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setErrorModal({ show: true, message: 'Không thể tải dữ liệu' });
    } finally {
      setLoading(false);
    }
  }

  function changePage(p) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleAddClick = () => {
    setFormData({
      proname: '',
      tinydes: '',
      fulldes: '',
      starting_price: '',
      bid_step: '100000',
      buy_now_price: '',
      auto_extend: false,
      catid: categories[0]?.catid || '',
      end_time: '',
      images: []
    });
    setShowAddModal(true);
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setFormData({
      proname: product.proname || '',
      tinydes: product.tinydes || '',
      fulldes: product.fulldes || '',
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

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (product) => {
    setDeleteConfirm(product);
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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.images.length < 3) {
      setErrorModal({ show: true, message: 'Vui lòng upload tối thiểu 3 ảnh (1 ảnh chính + 2 ảnh phụ)' });
      return;
    }

    try {
      await createAuctionProduct(formData);
      setShowAddModal(false);
      setPage(1); // Reset to first page
      loadData();
    } catch (error) {
      console.error('Error creating product:', error);
      setErrorModal({ show: true, message: error.response?.data?.result_message || 'Không thể tạo sản phẩm' });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.images.length < 3) {
      setErrorModal({ show: true, message: 'Vui lòng upload tối thiểu 3 ảnh (1 ảnh chính + 2 ảnh phụ)' });
      return;
    }

    try {
      await updateAuctionProduct(selectedProduct.proid, formData);
      setShowEditModal(false);
      loadData();
    } catch (error) {
      console.error('Error updating product:', error);
      setErrorModal({ show: true, message: error.response?.data?.result_message || 'Không thể cập nhật sản phẩm' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAuctionProduct(deleteConfirm.proid);
      setDeleteConfirm(null);
      // If current page becomes empty, go to previous page
      if (products.length === 1 && page > 1) {
        setPage(page - 1);
      }
      loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrorModal({ show: true, message: error.response?.data?.result_message || 'Không thể xóa sản phẩm' });
    }
  };

  const handleRateWinner = async (productId) => {
    if (ratingScore === null) {
      alert('Vui lòng chọn đánh giá');
      return;
    }

    setSubmittingRating(true);
    try {
      const response = await rateWinner(productId, ratingScore, ratingComment);

      if (response.result_code === 0) {
        alert('Đánh giá thành công!');
        setRatingModal({ show: false, product: null });
        setRatingScore(null);
        setRatingComment('');
        loadData(); // Reload to update rating status
      } else {
        alert(response.result_message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Rate winner error:', error);
      alert(error.response?.data?.result_message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleCancelTransaction = async (productId) => {
    if (!confirm('Bạn chắc chắn muốn huỷ giao dịch? Người thắng sẽ tự động nhận đánh giá tiêu cực (-1) với lý do "Người thắng không thanh toán"')) {
      return;
    }

    try {
      const response = await cancelTransaction(productId);
      if (response.result_code === 0) {
        alert('Đã huỷ giao dịch và đánh giá người thắng');
        loadData();
      } else {
        alert(response.result_message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Cancel transaction error:', error);
      alert(error.response?.data?.result_message || 'Không thể huỷ giao dịch');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-8 px-6 pb-28">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[#1E293B]">Quản lý sản phẩm đấu giá</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 bg-white rounded-lg animate-pulse shadow-sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F8FAFC] py-8 px-6 pb-28">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#1E293B]">Quản lý sản phẩm đấu giá</h1>
            <p className="text-[#64748B] mt-2">Quản lý các sản phẩm đấu giá của bạn</p>
          </div>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Đăng sản phẩm mới
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 border">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab('active');
                setPage(1);
              }}
              className={`flex-1 py-4 px-6 font-medium transition ${
                activeTab === 'active'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Đang đấu giá
            </button>
            <button
              onClick={() => {
                setActiveTab('ended');
                setPage(1);
              }}
              className={`flex-1 py-4 px-6 font-medium transition ${
                activeTab === 'ended'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Đã có người thắng
            </button>
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600">{total} sản phẩm</div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg">
            <div className="text-gray-400 text-lg mb-2">Chưa có sản phẩm nào</div>
            <div className="text-gray-500 text-sm mb-4">Nhấn "Đăng sản phẩm mới" để bắt đầu</div>
            <button
              onClick={handleAddClick}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded-lg"
            >
              <Plus className="w-5 h-5" />
              Đăng sản phẩm mới
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.proid} className="relative">
                {/* Action Buttons - Top */}
                {activeTab === 'active' ? (
                  <div className="absolute top-2 left-2 right-2 z-20 flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleViewDetails(product); }}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-white/95 hover:bg-[#3B82F6] border border-[#E2E8F0] hover:border-[#3B82F6] text-[#64748B] hover:text-white transition-all rounded shadow-sm"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-xs">Chi tiết</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditClick(product); }}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-white/95 hover:bg-[#10B981] border border-[#E2E8F0] hover:border-[#10B981] text-[#64748B] hover:text-white transition-all rounded shadow-sm"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-xs">Sửa</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(product); }}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-white/95 hover:bg-[#EF4444] border border-[#E2E8F0] hover:border-[#EF4444] text-[#64748B] hover:text-white transition-all rounded shadow-sm"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-xs">Xóa</span>
                    </button>
                  </div>
                ) : (
                  // Ended tab - Rating and Cancel buttons
                  <div className="absolute top-2 left-2 right-2 z-20 flex items-center gap-2">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setRatingModal({ 
                          show: true, 
                          product: product 
                        }); 
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-white/95 hover:bg-green-500 border border-[#E2E8F0] hover:border-green-500 text-[#64748B] hover:text-white transition-all rounded shadow-sm"
                      title="Đánh giá người thắng"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-xs">Đánh giá</span>
                    </button>
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (window.confirm('Bạn có chắc muốn hủy giao dịch? Người thắng sẽ bị trừ 1 điểm đánh giá.')) {
                          handleCancelTransaction(product.proid);
                        }
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-white/95 hover:bg-red-500 border border-[#E2E8F0] hover:border-red-500 text-[#64748B] hover:text-white transition-all rounded shadow-sm"
                      title="Hủy giao dịch"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-xs">Hủy</span>
                    </button>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-12 left-2 z-10">
                  <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full shadow-sm ${
                    activeTab === 'ended' || product.highest_bidder ? 'bg-blue-100 text-blue-700' :
                    product.status === 'active' ? 'bg-green-100 text-green-700' :
                    product.status === 'ended' ? 'bg-gray-100 text-gray-700' :
                    product.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {activeTab === 'ended' || product.highest_bidder ? 'Đã bán' :
                     product.status === 'active' ? 'Đang đấu giá' :
                     product.status === 'ended' ? 'Đã kết thúc' :
                     product.status === 'sold' ? 'Đã bán' : 'Chờ duyệt'}
                  </span>
                </div>

                <ProductCard
                  p={product}
                  onView={handleView}
                  onAddToWatchlist={() => {}}
                />
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* FIXED PAGINATION */}
      {!loading && totalPages > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] shadow-lg z-30">
          <div className="max-w-7xl mx-auto py-3 flex justify-center items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => changePage(page - 1)}
              className="px-4 py-2 border border-[#E2E8F0] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8FAFC] transition-colors"
            >
              Trước
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => changePage(p)}
                  className={`px-4 py-2 border rounded transition-all ${
                    p === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              disabled={page === totalPages}
              onClick={() => changePage(page + 1)}
              className="px-4 py-2 border border-[#E2E8F0] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8FAFC] transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      )}

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0] my-auto">
              <div className="bg-[#3B82F6] px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  {showAddModal ? <Plus className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                  {showAddModal ? 'Đăng sản phẩm đấu giá mới' : 'Chỉnh sửa sản phẩm'}
                </h2>
                <button 
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="text-white hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit}>
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
                        id="imageUpload"
                      />
                      <label 
                        htmlFor="imageUpload"
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
                      {categories.map(cat => (
                        <option key={cat.catid} value={cat.catid}>{cat.catname}</option>
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
                      Mô tả chi tiết *
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
                    />
                  </div>
                </div>

                <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                    className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all duration-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={formData.images.length < 3}
                    className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {showAddModal ? 'Đăng sản phẩm' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedProduct && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0]">
              <div className="bg-[#3B82F6] px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Chi tiết sản phẩm
                </h2>
              </div>
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-[#1E293B] mb-2">Hình ảnh</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProduct.images?.map((img, index) => (
                        <img key={index} src={img} alt={`Product ${index + 1}`} className="w-full h-32 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p><span className="font-semibold text-[#475569]">Tên:</span> {selectedProduct.proname}</p>
                    <p><span className="font-semibold text-[#475569]">Giá khởi điểm:</span> {formatPrice(selectedProduct.starting_price)}</p>
                    <p><span className="font-semibold text-[#475569]">Bước giá:</span> {formatPrice(selectedProduct.bid_step)}</p>
                    {selectedProduct.buy_now_price && (
                      <p><span className="font-semibold text-[#475569]">Giá mua ngay:</span> {formatPrice(selectedProduct.buy_now_price)}</p>
                    )}
                    <p><span className="font-semibold text-[#475569]">Số lượt đấu:</span> {selectedProduct.bid_count || 0}</p>
                    <p><span className="font-semibold text-[#475569]">Thời gian kết thúc:</span> {formatDateTime(selectedProduct.end_time)}</p>
                    <p><span className="font-semibold text-[#475569]">Tự động gia hạn:</span> {selectedProduct.auto_extend ? 'Có' : 'Không'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-[#1E293B] mb-2">Mô tả chi tiết</h3>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedProduct.fulldes }} />
                </div>
              </div>
              <div className="bg-[#F8FAFC] px-6 py-4 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-5 py-2.5 bg-[#64748B] hover:bg-[#475569] text-white font-medium transition-all duration-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden border border-[#E2E8F0]">
              <div className="bg-[#3B82F6] px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Xác nhận xóa</h2>
              </div>
              <div className="px-6 py-6">
                <p className="text-[#475569]">
                  Bạn có chắc chắn muốn xóa sản phẩm <span className="font-semibold text-[#1E293B]">{deleteConfirm.proname}</span>?
                </p>
              </div>
              <div className="bg-[#F8FAFC] px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {ratingModal.show && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden border border-[#E2E8F0]">
              <div className="bg-blue-600 from-blue-500 to-purple-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Đánh giá người thắng
                </h2>
                <button 
                  onClick={() => {
                    setRatingModal({ show: false, product: null });
                    setRatingScore(null);
                    setRatingComment('');
                  }}
                  className="text-white hover:text-gray-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="px-6 py-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Sản phẩm:</strong> {ratingModal.product?.proname}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Đánh giá người thắng đấu giá:
                  </label>
                  <div className="flex gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => setRatingScore(1)}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                        ratingScore === 1
                          ? 'bg-green-500 border-green-600 text-white shadow-lg scale-105'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
                      }`}
                    >
                      <ThumbsUp className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-sm font-medium">Tích cực (+1)</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRatingScore(-1)}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                        ratingScore === -1
                          ? 'bg-red-500 border-red-600 text-white shadow-lg scale-105'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-red-400'
                      }`}
                    >
                      <ThumbsDown className="w-6 h-6 mx-auto mb-1" />
                      <div className="text-sm font-medium">Tiêu cực (-1)</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Nhận xét:
                  </label>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về người thắng đấu giá..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRatingModal({ show: false, product: null });
                    setRatingScore(null);
                    setRatingComment('');
                  }}
                  className="px-5 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleRateWinner(ratingModal.product.proid)}
                  disabled={!ratingScore || submittingRating}
                  className="px-5 py-2.5 bg-blue-600 from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submittingRating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      Gửi đánh giá
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {errorModal.show && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden border border-[#E2E8F0]">
              <div className="bg-[#3B82F6] px-6 py-4 flex items-center justify-between">
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
      </>
  );
}
