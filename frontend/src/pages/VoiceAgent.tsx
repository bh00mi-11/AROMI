import { Mic } from "lucide-react";

export default function VoiceAgent() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 max-w-lg mx-auto">
      <div className="w-24 h-24 bg-gov-blue/10 rounded-full flex items-center justify-center mb-4">
        <Mic size={48} className="text-gov-blue animate-pulse" />
      </div>
      <h1 className="text-3xl font-black text-primary-navy">Global Voice Assistant</h1>
      <p className="text-slate-600 text-lg">
        The Voice Assistant is now universally available across all screens in AROOMI! 
        You don't need a dedicated page for it anymore.
      </p>
      <div className="px-8 py-4 bg-slate-100 text-slate-800 rounded-full font-bold shadow-sm flex items-center gap-3 text-lg">
        <Mic size={24} className="text-gov-blue" />
        Click the floating microphone bubble on the bottom right
      </div>
    </div>
  );
}
