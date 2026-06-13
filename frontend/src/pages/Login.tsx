import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("priya@aromi.demo");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      toast.error("गलत ईमेल या पासवर्ड");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-light flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl font-bold text-primary mb-2">AROMI</div>
          <div className="text-gray-600 text-sm">आंगनवाड़ी AI सहायक</div>
          <div className="text-gray-400 text-xs mt-1">Agentic & Autonomous System</div>
        </div>

        <div className="card">
          <h2 className="font-bold text-gray-700 mb-4 text-center">लॉग इन करें</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">ईमेल</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">पासवर्ड</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? "लॉग इन हो रहा है..." : "लॉग इन करें"}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-3">
            Demo: priya@aromi.demo / demo1234
          </p>
        </div>
      </div>
    </div>
  );
}
