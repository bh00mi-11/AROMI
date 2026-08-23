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
  const [lang, setLang] = useState<"hi" | "en">("hi");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      toast.error(lang === "hi" ? "गलत ईमेल या पासवर्ड — कृपया सही विवरण दर्ज करें" : "Invalid email or password — please enter correct details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4 md:p-6 text-text-main">
      <div className="w-full max-w-md space-y-6">
        {/* Language Toggle */}
        <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-semibold bg-white px-3 py-1.5 rounded-full border border-border-subtle shadow-2xs">
          <button 
            onClick={() => setLang("hi")}
            className={lang === "hi" ? "text-primary-navy" : "text-gray-500 hover:text-gov-blue"}
          >
            हिंदी
          </button>
          <span className="text-gray-300">|</span>
          <button 
            onClick={() => setLang("en")}
            className={lang === "en" ? "text-primary-navy" : "text-gray-500 hover:text-gov-blue"}
          >
            English
          </button>
        </div>

        {/* Government Emblem / Portal Header */}
        <div className="text-center space-y-2 mt-8 md:mt-0">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-navy/10 border border-primary-navy/20 text-primary-navy shadow-xs mb-2">
            <Shield size={28} />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-primary-navy tracking-tight">
            AROMI <span className="text-gov-blue">PORTAL</span>
          </h1>
          <div className="text-gray-700 text-xs font-semibold">
            {lang === "hi" ? "महिला व बाल विकास मंत्रालय (MWCD) • राष्ट्रीय पोषण निगरानी तंत्र" : "Ministry of Women and Child Development (MWCD) • National Nutrition Surveillance System"}
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
                {lang === "hi" ? "शासकीय लॉगिन" : "Official Login"}
              </h2>
              <p className="text-[11px] text-gray-500">
                {lang === "hi" ? "अधिकृत विभागीय ईमेल एवं पासवर्ड दर्ज करें" : "Enter authorized departmental email and password"}
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-bg-base text-primary-navy px-2 py-0.5 rounded border border-border-subtle">
              SECURE V2
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label={lang === "hi" ? "शासकीय ईमेल आईडी (Officer Email ID)" : "Officer Email ID"}
              required
              helperText={lang === "hi" ? "विभागीय पंजीकृत ईमेल आईडी दर्ज करें" : "Enter registered departmental email ID"}
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
              label={lang === "hi" ? "पासवर्ड (Security Password)" : "Security Password"}
              required
              helperText={lang === "hi" ? "गोपनीय विभागीय प्रमाणीकरण कुंजी" : "Confidential departmental authentication key"}
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
                  <span>{lang === "hi" ? "प्रमाणीकरण प्रक्रियाधीन..." : "Authenticating..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>{lang === "hi" ? "सत्यापित कर प्रवेश करें (Secure Login)" : "Secure Login"}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Footer */}
          <div className="pt-3 border-t border-border-subtle bg-bg-base/70 p-3 rounded-lg border border-border-subtle text-center space-y-1">
            <div className="text-[11px] font-bold text-text-main">{lang === "hi" ? "डेमो अभिगम साख" : "Test Credentials"}:</div>
            <div className="text-[11px] font-mono text-gray-600">
              Email: <strong>priya@aromi.demo</strong> | Pass: <strong>demo1234</strong>
            </div>
          </div>
        </div>

        {/* Security Disclaimer */}
        <div className="text-center text-[11px] text-gray-500 leading-relaxed">
          {lang === "hi" ? "राष्ट्रीय सूचना विज्ञान केंद्र (NIC) सुरक्षा दिशानिर्देशों के अनुरूप एन्क्रिप्टेड पोर्टल।" : "Encrypted portal in compliance with National Informatics Centre (NIC) security guidelines."}
        </div>
      </div>
    </div>
  );
}
