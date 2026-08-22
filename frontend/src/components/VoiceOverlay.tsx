import React, { useState, useRef } from 'react';
import { useVoiceContext } from '../features/voice/voiceContext';
import { voiceAPI } from '../lib/api';
import { Mic, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function VoiceOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aromiResponse, setAromiResponse] = useState("");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  
  const { context, updateContext } = useVoiceContext();
  const navigate = useNavigate();
  const location = useLocation();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.current = recorder;
      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setAromiResponse("");
      setTranscript("");
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setAromiResponse("Thinking...");
    try {
      const fd = new FormData();
      fd.append("audio", blob, "recording.webm");
      
      // Update context route before sending
      const currentContext = { ...context, current_route: location.pathname };
      fd.append("context", JSON.stringify(currentContext));

      const res = await voiceAPI.process(fd);
      const data = res.data;
      
      setTranscript(data.transcribed_text || "");
      setAromiResponse(data.agent_response_text || "Done.");

      // Dispatch actions based on mode
      if (data.mode === 'navigate' && data.route) {
        if (data.route === 'BACK') navigate(-1);
        else navigate(data.route);
      } else if (data.mode === 'draft_update' && data.pending_action) {
         // Update form context
         if (data.pending_action.weight_kg) updateContext({ draft_fields: { ...context.draft_fields, weight_kg: data.pending_action.weight_kg } });
         if (data.pending_action.height_cm) updateContext({ draft_fields: { ...context.draft_fields, height_cm: data.pending_action.height_cm } });
      }

      if (data.agent_response_text) {
        speak(data.agent_response_text);
      }
    } catch (err) {
      console.error(err);
      setAromiResponse("Sorry, I encountered an error.");
    }
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 z-50"
      >
        <Mic size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-xl shadow-2xl p-4 border border-gray-200 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">AROMI Voice</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 min-h-[60px]">
              {transcript ? <p><span className="font-semibold text-gray-800">You:</span> {transcript}</p> : <p className="italic">Speak your command...</p>}
            </div>
            
            <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-900 min-h-[60px]">
              {aromiResponse ? <p><span className="font-semibold">AROMI:</span> {aromiResponse}</p> : <p className="italic">Waiting...</p>}
            </div>

            <div className="flex justify-center pt-2">
              <button 
                onPointerDown={startRecording}
                onPointerUp={stopRecording}
                onPointerLeave={stopRecording}
                className={`p-4 rounded-full text-white transition-all ${isRecording ? 'bg-red-500 scale-110 shadow-red-500/50 shadow-lg' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                <Mic size={28} />
              </button>
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">Hold to speak, release to send</p>
          </div>
        </div>
      )}
    </>
  );
}
