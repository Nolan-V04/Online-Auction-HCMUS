import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loginLocal,
  loginWithGoogle,
  loginWithFacebook,
  loginWithGithub,
  loginWithTwitter,
} from "../../services/auth.service.js";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const data = await loginLocal(username, password);
      if (data?.result_code === 0) {
        await refreshUser();
        navigate("/");
      } else {
        setErrorMsg(data?.result_message || "Đăng nhập thất bại");
      }
    } catch (err) {
      setErrorMsg(err?.message || "Không thể kết nối máy chủ");
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-50" style={{ minHeight: 'calc(100vh - 6rem)' }}>
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-6 text-center">Đăng nhập</h2>

        {errorMsg && (
          <div className="mb-4 text-red-600 text-sm">{errorMsg}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
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
            <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Đăng nhập
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-xs text-gray-500">hoặc</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={loginWithGoogle} className="border px-3 py-2 rounded hover:bg-gray-50">Google</button>
          <button onClick={loginWithFacebook} className="border px-3 py-2 rounded hover:bg-gray-50">Facebook</button>
          <button onClick={loginWithGithub} className="border px-3 py-2 rounded hover:bg-gray-50">GitHub</button>
          <button onClick={loginWithTwitter} className="border px-3 py-2 rounded hover:bg-gray-50">Twitter</button>
        </div>
      </div>
    </div>
  );
}
