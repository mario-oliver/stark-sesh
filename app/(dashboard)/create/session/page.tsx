import { Suspense } from "react";
import CreateSessionContent from "./CreateSessionContent";

function CreateSessionFallback() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 flex items-center justify-center">
      <p className="text-zinc-500">Loading session…</p>
    </div>
  );
}

export default function CreateSessionPage() {
  return (
    <Suspense fallback={<CreateSessionFallback />}>
      <CreateSessionContent />
    </Suspense>
  );
}
