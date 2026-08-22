import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { Shield, Lock, Mail, Loader, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { FormField } from "../components/FormField";

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
      toast.error("गलत ईमेल या पासवर्ड — कृपया सही विवरण दर्ज करें");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4 md:p-6 text-text-main">
      <div className="w-full max-w-md space-y-6">
        {/* Government Emblem / Portal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-navy/10 border border-primary-navy/20 text-primary-navy shadow-xs mb-2">
            <Shield size={28} />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-primary-navy tracking-tight">
            AROMI <span className="text-gov-blue">PORTAL</span>
          </h1>
          <div className="text-gray-700 text-xs font-semibold">
            महिला व बाल विकास मंत्रालय (MWCD) • राष्ट्रीय पोषण निगरानी तंत्र
          </div>
          <div className="text-gray-500 text-[11px] font-mono">
            Official Anganwadi Officer & Administrative Authentication Gateway
          </div>
        </div>

        {/* Structured Login Card */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-border-subtle space-y-5">
          <div className="pb-3 border-b border-border-subtle flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-text-main">
                शासकीय लॉगिन (Official Login)
              </h2>
              <p className="text-[11px] text-gray-500">
                अधिकृत विभागीय ईमेल एवं पासवर्ड दर्ज करें
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-bg-base text-primary-navy px-2 py-0.5 rounded border border-border-subtle">
              SECURE V2
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="शासकीय ईमेल आईडी (Officer Email ID)"
              required
              helperText="विभागीय पंजीकृत ईमेल आईडी दर्ज करें"
            >
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="priya@aromi.demo"
                  className="input-gov pl-9"
                  required
                />
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </FormField>

            <FormField
              label="पासवर्ड (Security Password)"
              required
              helperText="गोपनीय विभागीय प्रमाणीकरण कुंजी"
            >
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-gov pl-9"
                  required
                />
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </FormField>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 font-semibold text-xs md:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>प्रमाणीकरण प्रक्रियाधीन...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>सत्यापित कर प्रवेश करें (Secure Login)</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Footer */}
          <div className="pt-3 border-t border-border-subtle bg-bg-base/70 p-3 rounded-lg border border-border-subtle text-center space-y-1">
            <div className="text-[11px] font-bold text-text-main">डेमो अभिगम साख (Test Credentials):</div>
            <div className="text-[11px] font-mono text-gray-600">
              Email: <strong>priya@aromi.demo</strong> | Pass: <strong>demo1234</strong>
            </div>
          </div>
        </div>

        {/* Security Disclaimer */}
        <div className="text-center text-[11px] text-gray-500 leading-relaxed">
          राष्ट्रीय सूचना विज्ञान केंद्र (NIC) सुरक्षा दिशानिर्देशों के अनुरूप एन्क्रिप्टेड पोर्टल।
        </div>
      </div>
    </div>
  );
}
