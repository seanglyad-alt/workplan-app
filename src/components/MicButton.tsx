import React, { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

export function MicButton({ onTranscribed }: { onTranscribed: (text: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        
        try {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64data = (reader.result as string).split(',')[1];
            
            const res = await fetch("/api/transcribe", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(localStorage.getItem("token") ? { "Authorization": `Bearer ${localStorage.getItem("token")}` } : {})
              },
              body: JSON.stringify({
                audioData: base64data,
                mimeType: "audio/webm"
              })
            });

            if (!res.ok) throw new Error("Transcription failed");
            const data = await res.json();
            if (data.text) {
              onTranscribed(data.text);
            }
          };
        } catch (err) {
          console.error("Error transcribing:", err);
          alert("បរាជ័យក្នុងការបំប្លែងសំឡេង (Transcription failed)");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing mic:", err);
      alert("មិនអាចប្រើប្រាស់ម៉ៃក្រូហ្វូនបានទេ! សូមពិនិត្យ Permission។");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (isTranscribing) {
    return (
      <button type="button" disabled className="text-slate-400 p-2 opacity-50 cursor-not-allowed">
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  if (isRecording) {
    return (
      <button
        type="button"
        onClick={stopRecording}
        className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 rounded-lg animate-pulse transition-colors"
        title="បញ្ឈប់ការថត (Stop Recording)"
      >
        <Square className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      className="text-slate-400 hover:text-blue-400 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
      title="និយាយបញ្ចូល (Voice Input)"
    >
      <Mic className="w-4 h-4" />
    </button>
  );
}
