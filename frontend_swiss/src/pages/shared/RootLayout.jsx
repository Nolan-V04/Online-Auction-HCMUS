import React, { Suspense } from 'react';
import { Outlet, useNavigation } from "react-router";
import { useState } from 'react';
import Navbar from "./NavBar";
// Lazy-load LeftMenu so import/runtime errors don't take down the whole app
const LeftMenu = React.lazy(() => import('./LeftMenu'));
import ErrorBoundary from "./ErrorBoundary";

export default function RootLayout() {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {isNavigating && <GlobalSpinner />}

      {/* NAVBAR */}
      <Navbar onToggleMenu={() => setMenuOpen(v => !v)} />

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