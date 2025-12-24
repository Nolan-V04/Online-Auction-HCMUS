import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProducts, removeProduct } from '@/services/admin.service.js';
import { Trash2 } from 'lucide-react';

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await listProducts();
        setProducts((res.products || []).sort((a, b) => a.proid - b.proid));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
  }

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><p className="text-[#64748B]">Đang tải…</p></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12">
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
                Giá
              </th>
              <th className="text-right px-8 py-4 text-sm font-bold text-[#64748B] uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {products.length > 0 ? (
              products.map(p => (
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
                  <td className="px-8 py-2 text-base text-[#64748B] text-left">
                    {new Intl.NumberFormat('vi-VN').format(p.price)} ₫
                  </td>
                  <td className="px-8 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
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
                <td colSpan="4" className="px-8 py-12 text-center text-[#94A3B8]">
                  Không có sản phẩm
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-[#EF4444] px-6 py-4">
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
                className="px-5 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
              >
                Xóa
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
