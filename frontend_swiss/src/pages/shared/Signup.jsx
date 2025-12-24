import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [fullname, setFullname] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [captchaChecked, setCaptchaChecked] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!captchaChecked) {
      alert("Vui lòng xác nhận reCAPTCHA");
      return;
    }

    // TODO: call API gửi OTP
    console.log("Send OTP", { fullname, address, email, password });
    setOtpSent(true);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();

    // TODO: call API verify OTP + create user
    console.log("Verify OTP", { email, otp });

    alert("Đăng ký thành công!");
    navigate("/login");
  };

  return (
    <div
      className="flex items-center justify-center bg-gray-50"
      style={{ minHeight: "calc(100vh - 6rem)" }}
    >
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Đăng ký tài khoản
        </h2>

        {!otpSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Địa chỉ
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="TP. Hồ Chí Minh"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="••••••••"
              />
            </div>

            {/* Mock reCAPTCHA */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={captchaChecked}
                onChange={(e) => setCaptchaChecked(e.target.checked)}
              />
              <span className="text-sm text-gray-600">
                Tôi không phải là robot
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Gửi mã OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nhập mã OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="123456"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Xác nhận & Đăng ký
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
