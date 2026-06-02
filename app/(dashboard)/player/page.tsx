"use client";

import React, { useCallback, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { blobToWav } from "@/lib/audio-to-wav";

export default function PlayerPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not access microphone"
      );
    }
  }, []);

  const stopRecordingAndSend = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const b = new Blob(chunksRef.current, { type: recorder.mimeType });
        resolve(b);
      };
      recorder.stop();
    });

    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsRecording(false);

    if (blob.size === 0) {
      setError("No audio recorded");
      return;
    }

    setIsTranscribing(true);
    setError(null);
    try {
      // Convert to WAV so Whisper can decode reliably (browser webm/Opus often fails)
      const wavBlob = await blobToWav(blob);
      const file = new File([wavBlob], "recording.wav", { type: "audio/wav" });

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? data.details ?? "Transcription failed");
        return;
      }
      setTranscript(data.text ?? "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to transcribe audio"
      );
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Record & transcribe</h1>
        <p className="text-zinc-500 text-sm mb-8">
          Record audio and send it to Whisper for transcription.
        </p>

        <div className="flex flex-col items-center gap-6">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={isTranscribing}
              className="flex items-center justify-center gap-2 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black transition-colors"
              title="Start recording"
            >
              <Mic className="w-6 h-6" />
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecordingAndSend}
              className="flex items-center justify-center gap-2 w-14 h-14 rounded-full bg-red-500 hover:bg-red-400 text-white transition-colors animate-pulse"
              title="Stop and transcribe"
            >
              <Square className="w-5 h-5" fill="currentColor" />
            </button>
          )}

          <p className="text-sm text-zinc-500">
            {isRecording
              ? "Recording… Click the square to stop and transcribe."
              : isTranscribing
                ? "Transcribing…"
                : "Click the mic to start recording."}
          </p>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 px-4 py-2 rounded-lg w-full text-center">
              {error}
            </p>
          )}

          {transcript !== null && transcript !== "" && (
            <div className="w-full rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Transcript
              </p>
              <p className="text-zinc-200 whitespace-pre-wrap">{transcript}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
