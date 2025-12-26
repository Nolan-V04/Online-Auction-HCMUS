import { useState, useEffect, useRef } from "react";
import { useLoaderData, useNavigate, useActionData, useRevalidator } from "react-router";
import { Link, Form } from "react-router";

import { Plus, Pencil, Trash2, Eye, Edit } from 'lucide-react';
import { useCategoryRefresh } from '@/contexts/CategoryContext';

export default function ListCategories() {
  const navigate = useNavigate();
  const { records } = useLoaderData();
  const actionData = useActionData();
  const revalidator = useRevalidator();
  const { triggerRefresh } = useCategoryRefresh();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [productCount, setProductCount] = useState(0);
  const [formData, setFormData] = useState({
    catname: '',
    parent_id: ''
  });
  const lastProcessedActionRef = useRef(null);

  // Check for error or success from action
  useEffect(() => {
    // Skip if we already processed this actionData
    if (actionData === lastProcessedActionRef.current) {
      return;
    }
    
    if (actionData?.error) {
      setErrorMessage(actionData.message);
      setShowErrorModal(true);
      setDeleteConfirm(null);
      lastProcessedActionRef.current = actionData;
    } else if (actionData?.success) {
      // Success - trigger refresh and close modals
      triggerRefresh();
      revalidator.revalidate();
      setShowAddModal(false);
      setShowEditModal(false);
      setDeleteConfirm(null);
      lastProcessedActionRef.current = actionData;
    }
  }, [actionData]);

  // Organize categories into hierarchy
  const getCategoriesHierarchy = () => {
    const cats = records?.categories || [];
    const parentCategories = cats.filter(c => !c.parent_id);
    const childCategories = cats.filter(c => c.parent_id);
    
    const result = [];
    parentCategories.forEach(parent => {
      result.push({ ...parent, isParent: true, level: 0 });
      const children = childCategories.filter(child => child.parent_id === parent.catid);
      children.forEach(child => {
        result.push({ ...child, isChild: true, level: 1 });
      });
    });
    
    return result;
  };

  const handleViewDetails = async (category) => {
    setSelectedCategory(category);
    setShowDetailsModal(true);
    setProductCount(0); // Reset count
    // Fetch product count for this category
    try {
      console.log('Fetching product count for catid:', category.catid);
      const response = await fetch(`http://localhost:3000/api/products/count-by-category/${category.catid}`, {
        headers: {
          'apiKey': '12345ABCDE'
        }
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Product count data:', data);
      setProductCount(data.count || 0);
    } catch (error) {
      console.error('Failed to fetch product count:', error);
      setProductCount(0);
    }
  };

  const handleEditClick = (category) => {
    setSelectedCategory(category);
    setFormData({
      catname: category.catname,
      parent_id: category.parent_id || ''
    });
    setShowEditModal(true);
  };

  const handleAddClick = () => {
    setFormData({
      catname: '',
      parent_id: ''
    });
    setShowAddModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteClick = function (category) {
    setDeleteConfirm(category);
  };

  const hideDeleteConfirmDialog = () => {
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12">
      {/* Header */}
      <div className="w-full max-w-4xl mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[#1E293B] tracking-tight">
              Danh Mục
            </h1>
            <p className="text-[#64748B] mt-2">
              Quản lý danh mục sản phẩm
            </p>
          </div>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
            aria-label="Add new category"
          >
            <Plus className="w-5 h-5" />
            Thêm Danh Mục
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full max-w-4xl bg-white border border-[#E2E8F0] overflow-hidden px-8 shadow-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                ID
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Danh mục cha
              </th>
              <th className="text-right px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {records && records.categories.length > 0 ? (
              getCategoriesHierarchy().map(category => (
                <tr
                  key={category.catid}
                  className="group hover:bg-[#F8FAFC] transition-colors duration-200"
                >
                  <td className="px-8 py-2 text-sm text-[#64748B] text-left">
                    {category.catid}
                  </td>
                  <td className="px-8 py-2 text-base text-[#64748B] text-left">
                    <span style={{ 
                      paddingLeft: `${category.level * 24}px`,
                      fontWeight: category.isParent ? 'bold' : 'normal' 
                    }}>
                      {category.isChild && '└─ '}
                      {category.catname}
                    </span>
                  </td>
                  <td className="px-8 py-2 text-sm text-[#64748B] text-left">
                    {category.parent_id ? (
                      records.categories.find(c => c.catid === category.parent_id)?.catname || '-'
                    ) : '-'}
                  </td>
                  <td className="px-8 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {/* View Button */}
                      <button
                        onClick={() => handleViewDetails(category)}
                        className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0] bg-white hover:bg-[#3B82F6] hover:border-[#3B82F6] text-[#64748B] hover:text-white transition-all duration-200 cursor-pointer group/btn shadow-sm hover:shadow-md"
                        aria-label={`View ${category.catname}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditClick(category)}
                        className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0] bg-white hover:bg-[#10B981] hover:border-[#10B981] text-[#64748B] hover:text-white transition-all duration-200 cursor-pointer group/btn shadow-sm hover:shadow-md"
                        aria-label={`Edit ${category.catname}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteClick(category)}
                        className="inline-flex items-center justify-center w-9 h-9 border border-[#E2E8F0] bg-white hover:bg-[#EF4444] hover:border-[#EF4444] text-[#64748B] hover:text-white transition-all duration-200 cursor-pointer group/btn shadow-sm hover:shadow-md"
                        aria-label={`Delete ${category.catname}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="px-8 py-12 text-center text-[#94A3B8]"
                >
                  No categories found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedCategory && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0] my-auto">
            <div className="bg-[#3B82F6] px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Chi tiết danh mục
              </h2>
            </div>
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
              <div className="mb-4">
                <p className="text-[#475569] text-base mb-2">
                  ID: <span className="font-semibold text-[#1E293B]">{selectedCategory.catid}</span>
                </p>
                <p className="text-[#475569] text-base mb-2">
                  Tên danh mục: <span className="font-semibold text-[#1E293B]">{selectedCategory.catname}</span>
                </p>
                <p className="text-[#475569] text-base mb-2">
                  Danh mục cha: <span className="font-semibold text-[#1E293B]">
                    {selectedCategory.parent_id 
                      ? records.categories.find(c => c.catid === selectedCategory.parent_id)?.catname || 'N/A'
                      : 'Không có (Danh mục gốc)'}
                  </span>
                </p>
                <p className="text-[#475569] text-base mb-2">
                  Số lượng sản phẩm: <span className="font-semibold text-[#1E293B]">{productCount}</span>
                </p>
              </div>
            </div>
            <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2.5 bg-[#64748B] hover:bg-[#475569] text-white font-medium transition-all duration-200 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0] my-auto">
            <div className="bg-[#3B82F6] px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Thêm danh mục mới
              </h2>
            </div>
            <Form method="post" onSubmit={() => setShowAddModal(false)}>
              <input type="hidden" name="intent" value="add" />
              <div className="px-6 py-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#475569] mb-2">Tên danh mục *</label>
                    <input
                      type="text"
                      name="catname"
                      value={formData.catname}
                      onChange={handleFormChange}
                      required
                      maxLength="50"
                      className="w-full px-4 py-2 border border-[#E2E8F0] rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#475569] mb-2">Danh mục cha</label>
                    <select
                      name="parent_id"
                      value={formData.parent_id}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-[#E2E8F0] rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    >
                      <option value="">-- Không có (Danh mục gốc) --</option>
                      {records.categories.filter(c => !c.parent_id).map(cat => (
                        <option key={cat.catid} value={cat.catid}>
                          {cat.catname}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all duration-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium transition-all duration-200 cursor-pointer"
                >
                  Thêm
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0] my-auto">
            <div className="bg-[#3B82F6] px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Cập nhật danh mục
              </h2>
            </div>
            <Form method="post" onSubmit={() => setShowEditModal(false)}>
              <input type="hidden" name="intent" value="update" />
              <input type="hidden" name="catid" value={selectedCategory.catid} />
              <div className="px-6 py-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#475569] mb-2">Tên danh mục *</label>
                    <input
                      type="text"
                      name="catname"
                      value={formData.catname}
                      onChange={handleFormChange}
                      required
                      maxLength="50"
                      className="w-full px-4 py-2 border border-[#E2E8F0] rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#475569] mb-2">Danh mục cha</label>
                    <select
                      name="parent_id"
                      value={formData.parent_id}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-[#E2E8F0] rounded focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    >
                      <option value="">-- Không có (Danh mục gốc) --</option>
                      {records.categories.filter(c => !c.parent_id && c.catid !== selectedCategory.catid).map(cat => (
                        <option key={cat.catid} value={cat.catid}>
                          {cat.catname}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all duration-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-medium transition-all duration-200 cursor-pointer"
                >
                  Cập nhật
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0]">
            {/* Modal Header */}
            <div className="bg-[#3B82F6] px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Xác nhận xóa
              </h2>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              <p className="text-[#475569] text-base">
                Bạn có chắc muốn xóa danh mục{' '}
                <span className="font-semibold text-[#1E293B]">
                  "{deleteConfirm.catname}"
                </span>
                ?
              </p>
              <p className="text-[#94A3B8] text-sm mt-2">
                Không thể xóa nếu danh mục đang có sản phẩm.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={hideDeleteConfirmDialog}
                className="px-5 py-2.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] font-medium transition-all duration-200 cursor-pointer shadow-sm"
              >
                Hủy
              </button>
              <Form method="post" onSubmit={hideDeleteConfirmDialog}>
                <input
                  type="hidden"
                  name="intent"
                  value="delete"
                />
                <input
                  type="hidden"
                  name="catid"
                  value={deleteConfirm.catid}
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
                >
                  Xóa
                </button>
              </Form>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E2E8F0]">
            {/* Modal Header */}
            <div className="bg-[#EF4444] px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Lỗi xóa danh mục
              </h2>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              <p className="text-[#475569] text-base">
                {errorMessage}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#F8FAFC] px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-5 py-2.5 bg-[#64748B] hover:bg-[#475569] text-white font-medium transition-all duration-200 cursor-pointer"
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