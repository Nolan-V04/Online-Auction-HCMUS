import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, User, Settings, LogOut, Package, Heart } from 'lucide-react';

export default function Navbar({ onToggleMenu }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openSubDropdown, setOpenSubDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
    setOpenSubDropdown(null);
  };

  const toggleSubDropdown = (name) => {
    setOpenSubDropdown(openSubDropdown === name ? null : name);
  };

  const navigate = useNavigate();

  const handleLogin = () => {
    setOpenDropdown(null);
    navigate('/signin');
  };

  const handleSignup = () => {
    setOpenDropdown(null);
    navigate('/signup');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setOpenDropdown(null);
  };

  return (
    <header className='sticky top-0 z-50 w-full bg-white border-b border-[#E2E8F0]'>
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                {/* Mobile menu button + Logo */}
                <div className="flex items-center gap-3">
                  <button onClick={onToggleMenu} className="md:hidden p-2 rounded-md hover:bg-gray-100" aria-label="Open menu">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="M3 12h18M3 6h18M3 18h18"></path></svg>
                  </button>

                  <div className="flex-shrink-0">
                    <h1
                      onClick={() => navigate('/')}
                      className="text-2xl font-bold text-blue-600 cursor-pointer select-none"
                      role="button"
                    >
                      AUTION SHOP
                    </h1>
                  </div>
                </div>

                {/* Auth Section */}
                <div className="flex items-center">
                    {!isLoggedIn ? (
                    <div className="flex items-center space-x-4">
                        <button
                        onClick={handleLogin}
                        className="text-gray-700 hover:text-blue-600 font-medium"
                        >
                        Đăng nhập
                        </button>
                        <button 
                        onClick={handleSignup}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Đăng ký
                        </button>
                    </div>
                    ) : (
                    <div className="relative">
                        <button
                        onClick={() => toggleDropdown('user')}
                        className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-lg"
                        >
                        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                        </button>

                        {openDropdown === 'user' && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border z-50">
                            <div className="px-4 py-3 border-b">
                            <p className="font-medium text-gray-800">Nguyễn Văn A</p>
                            <p className="text-sm text-gray-500">user@example.com</p>
                            </div>
                            <a
                            href="#"
                            className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50"
                            >
                            <Package className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">Đơn hàng</span>
                            </a>
                            <a
                            href="#"
                            className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50"
                            >
                            <Heart className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">Yêu thích</span>
                            </a>
                            <a
                            href="#"
                            className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50"
                            >
                            <Settings className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">Cài đặt</span>
                            </a>
                            <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-3 hover:bg-gray-50 w-full text-left border-t"
                            >
                            <LogOut className="w-4 h-4 text-red-600" />
                            <span className="text-red-600">Đăng xuất</span>
                            </button>
                        </div>
                        )}
                    </div>
                    )}
                </div>
                </div>
            </div>
            </nav>
    </header>
    
  );
}

