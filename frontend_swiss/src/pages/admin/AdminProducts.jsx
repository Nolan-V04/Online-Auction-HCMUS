import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProducts, removeProduct, addProduct, updateProduct, getProductDetails } from '@/services/admin.service.js';
import { fetchCategories } from '@/services/category.service.jsx';
import { Trash2, Eye, Edit, Plus, X, Upload } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useCategoryRefresh } from '@/contexts/CategoryContext';
import { uploadImages } from '@/services/seller.service.js';

// Helper function to clean HTML content
const cleanHtmlContent = (html) => {
  if (!html) return '';
  // Replace literal \n with actual line breaks
  return html.replace(/\\n/g, '<br />');
};

export default function AdminProducts() {
  const navigate = useNavigate();
  const { triggerRefresh } = useCategoryRefresh();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, message: '' });
  const [formData, setFormData] = useState({
    proname: '',
    tinydes: '',
    fulldes: '',
    catid: '',
    starting_price: '',
    bid_step: '100000',
    buy_now_price: '',
    auto_extend: false,
    end_time: '',
    images: []
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetchCategories();
      setCategories(res.categories || []);
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error);
    }
  };

  // Hàm tổ chức categories thành cấu trúc phân cấp để hiển thị
  const getCategoriesHierarchy = () => {
    const cats = categories || [];
    const parentCategories = cats.filter(c => !c.parent_id);
    const childCategories = cats.filter(c => c.parent_id);
    
    const result = [];
    parentCategories.forEach(parent => {
      result.push({ ...parent, isParent: true });
      const children = childCategories.filter(child => child.parent_id === parent.catid);
      children.forEach(child => {
        result.push({ ...child, isChild: true });
      });
    });
    
    // Thêm các danh mục không có parent (orphan)
    const orphans = childCategories.filter(c => 
      !parentCategories.some(p => p.catid === c.parent_id)
    );
    orphans.forEach(orphan => {
      result.push(orphan);
    });
    
    return result;
  };

  // Filter products by category (including children if parent is selected)
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : (() => {
        const selectedCatId = parseInt(selectedCategory);
        // Find if selected category has children
        const childCategories = categories.filter(c => c.parent_id === selectedCatId);
        
        if (childCategories.length > 0) {
          // If it's a parent, include products from all children
          const childIds = childCategories.map(c => c.catid);
          return products.filter(p => childIds.includes(p.catid));
        } else {
          // If it's a child or has no children, show only its products
          return products.filter(p => p.catid === selectedCatId);
        }
      })();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await listProducts();
      setProducts((res.products || []).sort((a, b) => a.proid - b.proid));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (product) => {
    setDeleteConfirm(product);
  };

  const hideDeleteConfirmDialog = () => {
    setDeleteConfirm(null);
  };

  async function handleRemove() {
    const res = await removeProduct(deleteConfirm.proid);
    alert(res.result_message || 'Đã xóa');
    setProducts((prev) => prev.filter(x => x.proid !== deleteConfirm.proid));
    hideDeleteConfirmDialog();
    triggerRefresh(); // Update LeftMenu
  }

  const handleViewDetails = async (product) => {
    try {
      const res = await getProductDetails(product.proid);
      setSelectedProduct(res.product);
      setShowDetailsModal(true);
    } catch (error) {
      alert('Không thể tải thông tin sản phẩm');
    }
  };

  const handleEditClick = (product) => {
    setFormData({
      proname: product.proname || '',
      tinydes: product.tinydes || '',
      fulldes: product.fulldes || '',
      catid: product.catid || '',
      starting_price: product.starting_price || product.price || '',
      bid_step: product.bid_step || '100000',
      buy_now_price: product.buy_now_price || '',
      auto_extend: product.auto_extend || false,
      end_time: product.end_time ? new Date(product.end_time).toISOString().slice(0, 16) : '',
      images: product.images || []
    });
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleAddClick = () => {
    setFormData({
      proname: '',
      tinydes: '',
      fulldes: '',
      catid: '',
      starting_price: '',
      bid_step: '100000',
      buy_now_price: '',
      auto_extend: false,
      end_time: '',
      images: []
    });
    setShowAddModal(true);
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
      const dataToSend = {
        proname: formData.proname,
        tinydes: formData.tinydes,
        fulldes: formData.fulldes,
        starting_price: parseInt(formData.starting_price),
        price: parseInt(formData.starting_price), // Compatibility
        bid_step: parseInt(formData.bid_step),
        buy_now_price: formData.buy_now_price ? parseInt(formData.buy_now_price) : null,
        auto_extend: formData.auto_extend === true || formData.auto_extend === 'true',
        catid: parseInt(formData.catid),
        quantity: 1,
        end_time: formData.end_time,
        images: formData.images,
        status: 'active',
        bid_count: 0
      };
      console.log('Adding product with data:', dataToSend);
      const res = await addProduct(dataToSend);
      alert(res.result_message || 'Đã thêm sản phẩm');
      setShowAddModal(false);
      loadProducts();
      triggerRefresh();
    } catch (error) {
      console.error('Add product error:', error);
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
      const dataToSend = {
        proname: formData.proname,
        tinydes: formData.tinydes,
        fulldes: formData.fulldes,
        starting_price: parseInt(formData.starting_price),
        price: parseInt(formData.starting_price), // Compatibility
        bid_step: parseInt(formData.bid_step),
        buy_now_price: formData.buy_now_price ? parseInt(formData.buy_now_price) : null,
        auto_extend: formData.auto_extend === true || formData.auto_extend === 'true',
        catid: parseInt(formData.catid),
        end_time: formData.end_time,
        images: formData.images
      };
      console.log('Updating product with data:', dataToSend);
      const res = await updateProduct(selectedProduct.proid, dataToSend);
      alert(res.result_message || 'Đã cập nhật sản phẩm');
      setShowEditModal(false);
      loadProducts();
      triggerRefresh();
    } catch (error) {
      console.error('Update product error:', error);
      setErrorModal({ show: true, message: error.response?.data?.result_message || 'Không thể cập nhật sản phẩm' });
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><p className="text-[#64748B]">Đang tải…</p></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12 relative">
      {/* Header */}
      <div className="w-full max-w-6xl mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#1E293B] tracking-tight">
              Quản lý sản phẩm
            </h1>
            <p className="text-[#64748B] mt-2">
              Quản lý danh sách sản phẩm
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-[#475569]">Danh mục:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-[#E2E8F0] rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-white text-[#475569]"
              >
                <option value="all">Tất cả</option>
                {getCategoriesHierarchy().map(cat => (
                  <option 
                    key={cat.catid} 
                    value={cat.catid}
                    style={{ fontWeight: cat.isParent ? 'bold' : 'normal' }}
                  >
                    {cat.isChild ? '    └─ ' : ''}{cat.catname}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Thêm sản phẩm
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full max-w-6xl bg-white border border-[#E2E8F0] overflow-hidden px-8 shadow-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                ID
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Tên sản phẩm
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Danh mục
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Giá
              </th>
              <th className="text-right px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <tr
                  key={p.proid}
                  className="group hover:bg-[#F8FAFC] transition-colors duration-200"
                >
                  <td className="px-8 py-2 text-sm text-[#64748B] text-left">
                    {p.proid}
                  </td>
                  <td className="px-8 py-2 text-base text-[#64748B] text-left">
                    {p.proname}
                  </td>
                  <td className="px-8 py-2 text-sm text-[#64748B] text-left">
                    {categories.find(c => c.catid === p.catid)?.catname || 'N/A'}
                  </td>
                  <td className="px-8 py-2 text-base text-[#64748B] text-left">
                    {new Intl.NumberFormat('vi-VN').format(p.price)} ₫
                  </td>
                  <td className="px-8 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleViewDetails(p)}
                        className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0] bg-white hover:bg-[#3B82F6] hover:border-[#3B82F6] text-[#64748B] hover:text-white transition-all duration-200 cursor-pointer group/btn shadow-sm hover:shadow-md"
                        aria-label={`View ${p.proname}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(p)}
                        className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0] bg-white hover:bg-[#10B981] hover:border-[#10B981] text-[#64748B] hover:text-white transition-all duration-200 cursor-pointer group/btn shadow-sm hover:shadow-md"
                        aria-label={`Edit ${p.proname}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(p)}
                        className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0] bg-white hover:bg-[#EF4444] hover:border-[#EF4444] text-[#64748B] hover:text-white transition-all duration-200 cursor-pointer group/btn shadow-sm hover:shadow-md"
                        aria-label={`Delete ${p.proname}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-8 py-12 text-center text-[#94A3B8]">
                  Không có sản phẩm
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0]">
            <div className="bg-[#3B82F6] px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Xác nhận xóa
              </h2>
            </div>
            <div className="px-6 py-6">
              <p className="text-[#475569] text-base">
                Bạn có chắc chắn muốn xóa sản phẩm{' '}
                <span className="font-semibold text-[#1E293B]">
                  "{deleteConfirm.proname}"
                </span>
                ?
              </p>
              <p className="text-[#94A3B8] text-sm mt-2">
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={hideDeleteConfirmDialog}
                className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all duration-200 cursor-pointer shadow-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleRemove}
                className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0] my-auto">
            <div className="bg-[#3B82F6] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Thêm sản phẩm đấu giá mới
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
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
                    style={{ height: '200px', marginBottom: '60px' }}
                  />
                </div>
              </div>

              <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all shadow-md"
                >
                  Thêm sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
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
                    style={{ height: '200px', marginBottom: '60px' }}
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

      {/* View Details Modal */}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0] my-auto">
            <div className="bg-[#3B82F6] px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Chi tiết sản phẩm
              </h2>
            </div>
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              <div className="mb-4">
                <p className="text-[#475569] text-base mb-2">
                  ID sản phẩm: <span className="font-semibold text-[#1E293B]">{selectedProduct.proid}</span>
                </p>
                <p className="text-[#475569] text-base mb-2">
                  Tên sản phẩm: <span className="font-semibold text-[#1E293B]">{selectedProduct.proname}</span>
                </p>
                <p className="text-[#475569] text-base mb-2">
                  Danh mục: <span className="font-semibold text-[#1E293B]">{categories.find(c => c.catid === selectedProduct.catid)?.catname || selectedProduct.catid}</span>
                </p>
                <p className="text-[#475569] text-base mb-2">
                  Giá hiện tại: <span className="font-semibold text-[#1E293B]">{new Intl.NumberFormat('vi-VN').format(selectedProduct.price)} ₫</span>
                </p>
                {selectedProduct.buy_price && (
                  <p className="text-[#475569] text-base mb-2">
                    Giá mua ngay: <span className="font-semibold text-[#1E293B]">{new Intl.NumberFormat('vi-VN').format(selectedProduct.buy_price)} ₫</span>
                  </p>
                )}
                {selectedProduct.step_price && (
                  <p className="text-[#475569] text-base mb-2">
                    Bước giá: <span className="font-semibold text-[#1E293B]">{new Intl.NumberFormat('vi-VN').format(selectedProduct.step_price)} ₫</span>
                  </p>
                )}
                {selectedProduct.quantity !== undefined && selectedProduct.quantity !== null && (
                  <p className="text-[#475569] text-base mb-2">
                    Số lượng: <span className="font-semibold text-[#1E293B]">{selectedProduct.quantity}</span>
                  </p>
                )}
                {selectedProduct.tinydes && (
                  <div className="text-[#475569] text-base mb-2">
                    <p className="font-medium mb-1">Mô tả ngắn:</p>
                    <div className="font-semibold text-[#1E293B] ml-4 ql-editor" dangerouslySetInnerHTML={{ __html: cleanHtmlContent(selectedProduct.tinydes) }} />
                  </div>
                )}
                {selectedProduct.fulldes && (
                  <div className="text-[#475569] text-base mb-2">
                    <p className="font-medium mb-1">Mô tả đầy đủ:</p>
                    <div className="font-semibold text-[#1E293B] ml-4 ql-editor" dangerouslySetInnerHTML={{ __html: cleanHtmlContent(selectedProduct.fulldes) }} />
                  </div>
                )}
                {selectedProduct.description && (
                  <p className="text-[#475569] text-base mb-2">
                    Mô tả: <span className="font-semibold text-[#1E293B]">{selectedProduct.description}</span>
                  </p>
                )}
                <p className="text-[#475569] text-base mb-2">
                  Số lần đấu giá: <span className="font-semibold text-[#1E293B]">{selectedProduct.bid_count || 0}</span>
                </p>
                <p className="text-[#475569] text-base mb-2">
                  Tự động gia hạn: <span className="font-semibold text-[#1E293B]">{selectedProduct.auto_renew ? 'Có' : 'Không'}</span>
                </p>
              </div>
            </div>
            <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-[#E2E8F0]">
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

      {/* Back button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button onClick={() => navigate('/admin')} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 shadow-lg">
          ← Quay lại
        </button>
      </div>
    </div>
  );
}
