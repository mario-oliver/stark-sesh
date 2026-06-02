"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mic, Square, ArrowLeft, Pencil, Check, X } from "lucide-react";
import { blobToWav } from "@/lib/audio-to-wav";
import { EVENT_LABELS, SESSION_TYPE_LABELS, eventTypeToSessionType, type EventType, type SessionType, type TeamMember } from "@/lib/types";
import { useApiClient } from "@/hooks/use-api-client";
import { normalizeSession, type ObservationRecord, type Session } from "@/lib/api/endpoints/sessions";

function parseEvent(s: string | null): EventType {
  if (s && ["tryout", "practice", "game", "scrimmage", "other"].includes(s))
    return s as EventType;
  return "practice";
}

function parseTeam(s: string | null): TeamMember[] {
  if (!s) return [];
  try {
    const decoded = decodeURIComponent(s);
    const arr = JSON.parse(decoded) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is TeamMember =>
        x != null &&
        typeof x === "object" &&
        "number" in x &&
        "name" in x &&
        (typeof (x as TeamMember).number === "string" && typeof (x as TeamMember).name === "string")
    );
  } catch {
    return [];
  }
}

function buildTranscribePrompt(sessionType: SessionType, team: TeamMember[]): string {
  const parts = [
    "This transcript is about basketball coaching.",
    `Session type: ${SESSION_TYPE_LABELS[sessionType]}.`,
    "It may include coaching terms, plays, sets, player positions, and game strategy.",
  ];
  if (team.length > 0) {
    const roster = team
      .filter((m) => m.number.trim() || m.name.trim())
      .map((m) => `#${m.number} ${m.name}`.trim())
      .filter(Boolean);
    if (roster.length > 0) {
      parts.push(`Players present (number and name): ${roster.join(", ")}. Use these when referring to players.`);
    }
  }
  return parts.join(" ");
}

type EditableObservationShape = {
  id: string;
  text: string;
  createdAt: string;
  recordedAt?: string;
  sessionId?: string;
  updatedAt?: string;
  scope?: "TEAM_WIDE" | "PLAYER_SPECIFIC" | "MIXED" | "UNKNOWN";
  taggingStatus?: "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED";
  taggingError?: string | null;
  taggedAt?: string | null;
  playerTags?: Array<{
    id?: string;
    teamMemberId: string;
    teamMember: { number: string; name: string };
  }>;
};

function observationToEditable(obs: ObservationRecord): EditableObservationShape {
  return {
    id: obs.id,
    sessionId: obs.sessionId,
    text: obs.text,
    createdAt: obs.recordedAt,
    recordedAt: obs.recordedAt,
    updatedAt: obs.updatedAt,
    scope: obs.scope,
    taggingStatus: obs.taggingStatus,
    taggingError: obs.taggingError,
    taggedAt: obs.taggedAt,
    playerTags: obs.playerTags.map((tag) => ({
      id: tag.id,
      teamMemberId: tag.teamMemberId,
      teamMember: { number: tag.teamMember.number, name: tag.teamMember.name },
    })),
  };
}

export default function CreateSessionContent() {
  const searchParams = useSearchParams();
  const { apiClient, isReady } = useApiClient();
  const sessionId = searchParams.get("sessionId");
  const eventFromUrl = parseEvent(searchParams.get("event"));
  const teamFromUrl = parseTeam(searchParams.get("team"));

  const [loadedSession, setLoadedSession] = useState<Session | null>(null);
  const [observations, setObservations] = useState<EditableObservationShape[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const hasFetchedSession = useRef(false);

  useEffect(() => {
    if (!isReady || !sessionId || hasFetchedSession.current) return;
    hasFetchedSession.current = true;
    apiClient
      .getSession(sessionId)
      .then((res: { data?: { session?: Session } }) => {
        const s = res.data?.session;
        if (s) {
          const norm = normalizeSession(s);
          setLoadedSession(norm);
          setObservations(norm.observations.map(observationToEditable));
        }
      })
      .catch(() => {
        setLoadedSession(null);
      });
  }, [isReady, sessionId, apiClient]);

  const sessionType = loadedSession?.type ?? eventTypeToSessionType(eventFromUrl);
  const team =
    loadedSession?.team?.members.map((m) => ({ number: m.number, name: m.name })) ?? teamFromUrl;
  const hasPendingTagging = observations.some(
    (o) => o.taggingStatus === "PENDING" || o.taggingStatus === "PROCESSING"
  );

  useEffect(() => {
    if (!isReady || !sessionId || !hasPendingTagging || editingId) return;
    let pollCount = 0;
    const maxPolls = 40; // ~2 minutes; prevents infinite polling if tagging gets stuck

    const interval = window.setInterval(() => {
      pollCount += 1;
      if (pollCount > maxPolls) {
        window.clearInterval(interval);
        return;
      }

      void apiClient
        .getSession(sessionId)
        .then((res: { data?: { session?: Session } }) => {
          const s = res.data?.session;
          if (!s) return;

          const norm = normalizeSession(s);
          setLoadedSession(norm);
          const nextObservations = norm.observations.map(observationToEditable);
          setObservations(nextObservations);

          const stillPending = nextObservations.some(
            (o) => o.taggingStatus === "PENDING" || o.taggingStatus === "PROCESSING"
          );
          if (!stillPending) window.clearInterval(interval);
        })
        .catch(() => undefined);
    }, 3000);

    return () => clearInterval(interval);
  }, [isReady, sessionId, hasPendingTagging, editingId, apiClient]);

  const startRecording = useCallback(() => {
    setError(null);
    setTranscript(null);
    navigator.mediaDevices.getUserMedia({ audio: true }).then(
      (stream) => {
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.start();
        setIsRecording(true);
      },
      (err) => {
        setError(err instanceof Error ? err.message : "Could not access microphone");
      }
    );
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
    const prompt = buildTranscribePrompt(sessionType, team);

    try {
      const wavBlob = await blobToWav(blob);
      const file = new File([wavBlob], "recording.wav", { type: "audio/wav" });
      const formData = new FormData();
      formData.append("file", file);

      let text = "";
      if (sessionId && isReady && apiClient) {
        const res = await apiClient.transcribeSession(sessionId, formData, { prompt }) as { data?: { text?: string; observation?: ObservationRecord } };
        text = (res.data?.text ?? "").trim();
        if (text && res.data?.observation) {
          const obs = res.data.observation;
          setObservations((prev) => [...prev, observationToEditable(obs)]);
          setEditingId(obs.id);
          setEditText(obs.text);
        }
      } else {
        const res = await fetch("/api/transcribe", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? data.details ?? "Transcription failed");
          return;
        }
        text = (data.text ?? "").trim();
        if (text) {
          const newId = crypto.randomUUID();
          setObservations((prev) => [
            ...prev,
            {
              id: newId,
              text,
              createdAt: new Date().toISOString(),
              scope: "UNKNOWN",
              taggingStatus: "FAILED",
              playerTags: [],
            },
          ]);
          setEditingId(newId);
          setEditText(text);
        }
      }
      setTranscript(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transcribe audio");
    } finally {
      setIsTranscribing(false);
    }
  }, [sessionType, team, sessionId, isReady, apiClient]);

  const startEdit = useCallback((obs: EditableObservationShape) => {
    setEditingId(obs.id);
    setEditText(obs.text);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText("");
  }, []);

  const saveObservation = useCallback(
    async (obs: EditableObservationShape) => {
      const trimmed = editText.trim();
      if (!trimmed) return;
      setSavingId(obs.id);
      try {
        if (sessionId) {
          try {
            const res = (await apiClient.updateObservation(sessionId, obs.id, { text: trimmed })) as {
              data?: { observation?: ObservationRecord };
            };
            const updated = res.data?.observation;
            if (updated) {
              setObservations((prev) =>
                prev.map((o) => (o.id === obs.id ? observationToEditable(updated) : o))
              );
              setEditingId(null);
              setEditText("");
              return;
            }
          } catch {
            // Observation may be local-only (no server id yet); update locally
          }
        }
        setObservations((prev) =>
          prev.map((o) => (o.id === obs.id ? { ...o, text: trimmed } : o))
        );
        setEditingId(null);
        setEditText("");
      } catch {
        setError("Failed to save observation");
      } finally {
        setSavingId(null);
      }
    },
    [sessionId, editText, apiClient]
  );

  const eventLabel = loadedSession ? SESSION_TYPE_LABELS[loadedSession.type] : EVENT_LABELS[eventFromUrl];
  const hasTeam = team.some((m) => m.number.trim() || m.name.trim());
  const teamLabel = loadedSession?.team?.name || (hasTeam ? `${team.length} player${team.length === 1 ? "" : "s"}` : null);

  const renderTagChips = (obs: EditableObservationShape) => {
    if (obs.taggingStatus === "PENDING" || obs.taggingStatus === "PROCESSING") {
      return (
        <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
          Tagging...
        </span>
      );
    }
    if (obs.taggingStatus === "FAILED" && sessionId) {
      return (
        <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300">
          Tagging failed
        </span>
      );
    }
    if (obs.playerTags && obs.playerTags.length > 0) {
      return (
        <>
          {obs.playerTags.map((tag, idx) => (
            <span
              key={tag.id ?? `${tag.teamMemberId}-${idx}`}
              className="inline-flex items-center rounded-full border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-300"
            >
              #{tag.teamMember.number || "-"} {tag.teamMember.name || "Unknown"}
            </span>
          ))}
        </>
      );
    }
    if (obs.scope === "TEAM_WIDE") {
      return (
        <span className="inline-flex items-center rounded-full border border-zinc-600 bg-zinc-800/70 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
          Team-wide
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 flex flex-col pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1">
        <div className="mb-6">
          <Link
            href={`/create/team?event=${encodeURIComponent(eventFromUrl)}`}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 active:text-zinc-300 mb-4 min-h-[44px] touch-target"
          >
            <ArrowLeft className="w-5 h-5" />
            Change event or team
          </Link>
          <p className="text-sm text-amber-400/90 font-medium uppercase tracking-wider">
            {eventLabel}
            {teamLabel && ` · ${teamLabel}`}
          </p>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight mt-1">
            Today’s observations
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Record your notes by voice. Each recording is transcribed and added below.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-400/10 border border-red-400/30 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {transcript !== null && transcript !== "" && (
          <div className="mb-6 w-full rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Last transcript
            </p>
            <p className="text-zinc-200 whitespace-pre-wrap text-sm">{transcript}</p>
          </div>
        )}

        {observations.length > 0 && (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 overflow-hidden">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3 border-b border-zinc-700/50">
              Entries for this session ({observations.length})
            </p>
            <div className="px-4 py-2 border-b border-zinc-700/50 text-[11px] text-zinc-500 flex flex-wrap gap-3">
              <span>Tagging... = analyzing transcript</span>
              <span>Blue chips = specific players</span>
              <span>Team-wide = note applies to whole team</span>
            </div>
            <ul className="divide-y divide-zinc-700/50">
              {observations.map((obs) => (
                <li key={obs.id} className="px-4 py-3">
                  {editingId === obs.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full min-h-[100px] rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-base text-zinc-200 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                        placeholder="Observation text…"
                        disabled={savingId === obs.id}
                      />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => saveObservation(obs)}
                          disabled={!editText.trim() || savingId === obs.id}
                          className="min-h-[44px] min-w-[88px] inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-black active:bg-amber-400 disabled:opacity-50 touch-target"
                        >
                          <Check className="w-4 h-4" />
                          {savingId === obs.id ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={savingId === obs.id}
                          className="min-h-[44px] min-w-[88px] inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-600 px-4 py-3 text-sm font-medium text-zinc-400 active:bg-zinc-800 disabled:opacity-50 touch-target"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-zinc-200 whitespace-pre-wrap text-sm sm:text-base flex-1 min-w-0 leading-snug">
                          {obs.text}
                        </p>
                        <button
                          type="button"
                          onClick={() => startEdit(obs)}
                          className="shrink-0 rounded-xl p-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-500 active:bg-zinc-700/50 active:text-amber-400 touch-target"
                          title="Edit"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {renderTagChips(obs)}
                        <span className="text-[11px] text-zinc-500">
                          {new Date(obs.recordedAt ?? obs.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-center text-zinc-600 text-sm mt-8">
          <Link href="/entries" className="inline-block py-3 min-h-[44px] touch-target text-zinc-400 active:text-zinc-300 underline">
            Back to entries
          </Link>
        </p>
      </div>

      {/* Sticky bottom record bar — thumb-friendly */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0c0c0c]/95 border-t border-zinc-800 flex flex-col items-center gap-2 pt-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={isTranscribing}
            className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-500 active:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black transition-colors touch-target shadow-lg"
            title="Start recording"
          >
            <Mic className="w-10 h-10 sm:w-12 sm:h-12" />
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecordingAndSend}
            className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-500 active:bg-red-400 text-white transition-colors animate-pulse touch-target shadow-lg"
            title="Stop and transcribe"
          >
            <Square className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" />
          </button>
        )}
        <p className="text-sm text-zinc-500">
          {isRecording
            ? "Recording… Tap to stop and transcribe."
            : isTranscribing
              ? "Transcribing…"
              : "Tap mic to record"}
        </p>
      </div>
    </div>
  );
}
