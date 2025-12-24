import { Outlet, useNavigate } from "react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { isLoggedIn, user, isAuthReady } = useAuth();

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isLoggedIn) {
      navigate('/signin');
      return;
    }
    if (user?.role_id !== 3) {
      navigate('/');
    }
  }, [isAuthReady, isLoggedIn, user, navigate]);

  if (!isAuthReady) {
    return <div className="p-8 text-center">Đang kiểm tra quyền truy cập…</div>;
  }

  if (!isLoggedIn || user?.role_id !== 3) {
    return <div className="p-8 text-center">Bạn không có quyền truy cập khu vực quản trị.</div>;
  }

  return <Outlet />;
}