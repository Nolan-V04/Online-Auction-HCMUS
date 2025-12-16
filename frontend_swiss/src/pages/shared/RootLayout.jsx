import { Outlet, useNavigation } from "react-router";

export default function RootLayout() {
  const navigation = useNavigation();
  const isNavigating = Boolean(navigation.location);

  return (
    <>
      {isNavigating && <GlobalSpinner />}
      <Outlet />
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