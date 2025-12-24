import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { requestOtp, verifyOtp } from "../../services/account.service.jsx";

export default function Signup() {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!recaptchaToken) {
      alert("Vui lòng xác nhận reCAPTCHA");
      return;
    }

    try {
      const payload = {
        username,
        password,
        name: fullname,
        email,
        dob,
        address,
        recaptchaToken
      };
      const data = await requestOtp(payload);
      if (data.result_code === 0) {
        setOtpSent(true);
        if (data.otp_preview) {
          console.log("DEV OTP:", data.otp_preview);
          alert(`[DEV MODE] Mã OTP của bạn là: ${data.otp_preview}`);
        }
      } else {
        alert(data.result_message || "Gửi OTP thất bại");
      }
    } catch (err) {
      console.error("handleSubmit error:", err);
      alert(`Lỗi hệ thống khi gửi OTP: ${err.message || 'Không thể kết nối với server'}`);
      console.error(err);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    try {
      const data = await verifyOtp({ email, otp });
      if (data.result_code === 0) {
        alert("Đăng ký thành công!");
        navigate("/signin");
      } else {
        alert(data.result_message || "Xác thực OTP thất bại");
      }
    } catch (err) {
      alert("Lỗi hệ thống khi xác thực OTP");
      console.error(err);
    }
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
                Tên đăng nhập
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="bidder123"
              />
            </div>

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
                Ngày sinh
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="mt-1 w-full border rounded px-3 py-2"
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

            {import.meta.env.VITE_RECAPTCHA_SITE_KEY ? (
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setRecaptchaToken(token || "")}
                onExpired={() => setRecaptchaToken("")}
                onErrored={() => setRecaptchaToken("")}
              />
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  onChange={(e) => setRecaptchaToken(e.target.checked ? "dev-ok" : "")}
                />
                <span className="text-sm text-gray-600">Tôi không phải là robot (DEV)</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Đăng Ký
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
