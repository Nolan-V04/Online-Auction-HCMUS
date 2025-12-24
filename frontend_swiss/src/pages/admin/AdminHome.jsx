import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminHome() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <div className="p-8 text-center">Bạn không có quyền truy cập khu vực quản trị.</div>;
  }

  const cards = [
    { title: 'Quản lý danh mục', desc: 'CRUD danh mục', to: '/admin/categories' },
    { title: 'Quản lý sản phẩm', desc: 'Gỡ bỏ sản phẩm', to: '/admin/products' },
    { title: 'Quản lý người dùng', desc: 'CRUD người dùng', to: '/admin/users' },
    { title: 'Yêu cầu nâng cấp', desc: 'Duyệt bidder ➠ seller', to: '/admin/seller-requests' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Quản lý trang web</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.title} className="bg-white rounded shadow p-5 cursor-pointer hover:shadow-md" onClick={() => navigate(c.to)}>
            <h2 className="text-lg font-semibold">{c.title}</h2>
            <p className="text-sm text-gray-600">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
