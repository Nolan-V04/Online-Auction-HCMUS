import React, { Suspense } from 'react';
import { Outlet, useNavigate } from "react-router";
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Navbar from "./NavBar";
import { useLoading } from "../../contexts/LoadingContext";
import { useAuth } from "../../contexts/AuthContext";
// Lazy-load LeftMenu so import/runtime errors don't take down the whole app
const LeftMenu = React.lazy(() => import('./LeftMenu'));
import ErrorBoundary from "./ErrorBoundary";

export default function RootLayout() {
  const { isLoading } = useLoading();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {isLoading && <GlobalSpinner />}

      {/* NAVBAR */}
      <Navbar onToggleMenu={() => setMenuOpen(v => !v)} />

      {/* Floating Add Button for Seller/Admin */}
      {(user?.role_id === 2 || user?.role_id === 3) && (
        <button
          onClick={() => navigate('/seller/products')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 group"
          aria-label="Quản lý sản phẩm đấu giá"
        >
          <Plus className="w-6 h-6" />
          <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Quản lý sản phẩm đấu giá
          </span>
        </button>
      )}

      {/* PAGE CONTENT: sidebar + main */}
      <div className="container mx-auto px-4 mt-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
        <ErrorBoundary>
          <Suspense fallback={<div className="p-4">Loading menu...</div>}>
            <LeftMenu mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
          </Suspense>
        </ErrorBoundary>

        <main>
          <Outlet />
        </main>
      </div>
    </>
  )
}

function GlobalSpinner() {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
        {/* Spinner Animation */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <p className="text-gray-700 font-medium text-lg">Loading...</p>
      </div>
    </div>
  );
}