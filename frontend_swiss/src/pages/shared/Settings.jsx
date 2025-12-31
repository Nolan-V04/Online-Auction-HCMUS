import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { Lock, Mail, Check, X, KeyRound } from 'lucide-react';
import axios from 'axios';

export default function Settings() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const { startLoading, stopLoading } = useLoading();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotShowOtpInput, setForgotShowOtpInput] = useState(false);
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotMessage, setForgotMessage] = useState({ type: '', text: '' });

  if (!isLoggedIn) {
    navigate('/signin');
    return null;
  }

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới không khớp' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }

    if (oldPassword === newPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải khác mật khẩu cũ' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    startLoading();

    try {
      const response = await axios.post('http://localhost:3000/auth/request-password-change-otp', {
        oldPassword,
        newPassword
      }, { withCredentials: true });

      if (response.data.result_code === 0) {
        setOtpSent(true);
        setShowOtpInput(true);
        setMessage({ type: 'success', text: 'Mã OTP đã được gửi đến email của bạn' });
      } else {
        setMessage({ type: 'error', text: response.data.result_message || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      console.error('Request OTP error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.result_message || 'Không thể gửi OTP. Vui lòng thử lại' 
      });
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  const handleVerifyAndChangePassword = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mã OTP 6 số' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    startLoading();

    try {
      const response = await axios.post('http://localhost:3000/auth/verify-and-change-password', {
        otp,
        oldPassword,
        newPassword
      }, { withCredentials: true });

      if (response.data.result_code === 0) {
        setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
        
        // Reset form
        setTimeout(() => {
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setOtp('');
          setShowOtpInput(false);
          setOtpSent(false);
          setMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setMessage({ type: 'error', text: response.data.result_message || 'Mã OTP không chính xác' });
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.result_message || 'Không thể xác minh OTP. Vui lòng thử lại' 
      });
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  // ===== FORGOT PASSWORD HANDLERS =====
  const handleRequestForgotPasswordOtp = async (e) => {
    e.preventDefault();

    if (!forgotEmail) {
      setForgotMessage({ type: 'error', text: 'Vui lòng nhập email' });
      return;
    }

    setLoading(true);
    setForgotMessage({ type: '', text: '' });
    startLoading();

    try {
      const response = await axios.post('http://localhost:3000/auth/request-forgot-password-otp', {
        email: forgotEmail
      });

      if (response.data.result_code === 0) {
        setForgotOtpSent(true);
        setForgotShowOtpInput(true);
        setForgotMessage({ type: 'success', text: 'Mã OTP đã được gửi đến email của bạn' });
      } else {
        setForgotMessage({ type: 'error', text: response.data.result_message || 'Có lỗi xảy ra' });
      }
    } catch (error) {
      console.error('Request forgot password OTP error:', error);
      setForgotMessage({ 
        type: 'error', 
        text: error.response?.data?.result_message || 'Không thể gửi OTP. Vui lòng thử lại' 
      });
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  const handleVerifyForgotPasswordOtp = async (e) => {
    e.preventDefault();

    if (!forgotOtp || forgotOtp.length !== 6) {
      setForgotMessage({ type: 'error', text: 'Vui lòng nhập mã OTP 6 số' });
      return;
    }

    if (!forgotNewPassword || !forgotConfirmPassword) {
      setForgotMessage({ type: 'error', text: 'Vui lòng điền đầy đủ thông tin mật khẩu' });
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotMessage({ type: 'error', text: 'Mật khẩu mới không khớp' });
      return;
    }

    if (forgotNewPassword.length < 6) {
      setForgotMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }

    setLoading(true);
    setForgotMessage({ type: '', text: '' });
    startLoading();

    try {
      const response = await axios.post('http://localhost:3000/auth/verify-forgot-password-otp', {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPassword
      });

      if (response.data.result_code === 0) {
        setForgotMessage({ type: 'success', text: 'Đặt lại mật khẩu thành công!' });
        
        // Reset form
        setTimeout(() => {
          setForgotEmail('');
          setForgotOtp('');
          setForgotNewPassword('');
          setForgotConfirmPassword('');
          setForgotShowOtpInput(false);
          setForgotOtpSent(false);
          setForgotMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setForgotMessage({ type: 'error', text: response.data.result_message || 'Mã OTP không chính xác' });
      }
    } catch (error) {
      console.error('Verify forgot password OTP error:', error);
      setForgotMessage({ 
        type: 'error', 
        text: error.response?.data?.result_message || 'Không thể xác minh OTP. Vui lòng thử lại' 
      });
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Cài đặt</h1>
          <p className="text-gray-600 mt-2">Quản lý cài đặt tài khoản của bạn</p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{user?.name || user?.username}</h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-800">Đổi mật khẩu</h2>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              <p>{message.text}</p>
            </div>
          )}

          <form onSubmit={showOtpInput ? handleVerifyAndChangePassword : handleRequestOtp} className="space-y-4">
            {/* Old Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu cũ <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={otpSent}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Nhập mật khẩu cũ"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={otpSent}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={otpSent}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            {/* OTP Input - Only show after OTP is sent */}
            {showOtpInput && (
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-4 text-blue-600">
                  <Mail className="w-5 h-5" />
                  <p className="text-sm">Mã OTP đã được gửi đến email: <strong>{user?.email}</strong></p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã OTP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <p className="text-sm text-gray-500 mt-2">Nhập mã OTP 6 số đã được gửi đến email</p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              {!otpSent ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Đang xử lý...' : 'Gửi mã OTP'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setShowOtpInput(false);
                      setOtp('');
                      setMessage({ type: '', text: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Đang xác minh...' : 'Xác nhận đổi mật khẩu'}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex items-center gap-2 mb-6">
            <KeyRound className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-800">Quên mật khẩu</h2>
          </div>

          <p className="text-gray-600 mb-4">
            Nếu bạn quên mật khẩu, hãy nhập email để nhận mã OTP và đặt lại mật khẩu mới.
          </p>

          {/* Forgot Password Message Display */}
          {forgotMessage.text && (
            <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
              forgotMessage.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {forgotMessage.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              <p>{forgotMessage.text}</p>
            </div>
          )}

          <form onSubmit={forgotShowOtpInput ? handleVerifyForgotPasswordOtp : handleRequestForgotPasswordOtp} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                disabled={forgotOtpSent}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Nhập email của bạn"
              />
            </div>

            {/* OTP and New Password - Only show after OTP is sent */}
            {forgotShowOtpInput && (
              <>
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-4 text-blue-600">
                    <Mail className="w-5 h-5" />
                    <p className="text-sm">Mã OTP đã được gửi đến email: <strong>{forgotEmail}</strong></p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã OTP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                    />
                    <p className="text-sm text-gray-500 mt-2">Nhập mã OTP 6 số đã được gửi đến email</p>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              {!forgotOtpSent ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail('');
                      setForgotMessage({ type: '', text: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Xóa
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Đang xử lý...' : 'Gửi mã OTP'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotOtpSent(false);
                      setForgotShowOtpInput(false);
                      setForgotOtp('');
                      setForgotNewPassword('');
                      setForgotConfirmPassword('');
                      setForgotMessage({ type: '', text: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Đang xác minh...' : 'Đặt lại mật khẩu'}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Back button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button onClick={() => navigate(-1)} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 shadow-lg">
          ← Quay lại
        </button>
      </div>
    </div>
  );
}
