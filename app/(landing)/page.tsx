import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Mic, ClipboardList, Lightbulb } from "lucide-react";
import { MarketingHero } from "@/components/marketing/MarketingHero";

const primaryButton =
  "bg-primary-brand hover:bg-primary-brand-hover text-white font-semibold rounded-full transition-colors";
const outlineButton =
  "border border-zinc-600 hover:border-zinc-500 text-zinc-200 rounded-full font-medium transition-colors";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 font-sans">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 79px,
            currentColor 79px,
            currentColor 80px
          )`,
        }}
      />
      <MarketingHero
        eyebrow="Voice AI coach assistant"
        headline={
          <>
            Your AI assistant for{" "}
            <span className="text-primary-brand">tryouts, practices, and games</span>
          </>
        }
        subheadline="Speak your observations in real time. FilmSesh keeps track of everything, then analyzes your full set of notes so you get key insights—who stood out, what to work on, and what to remember."
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignedOut>
            <SignUpButton forceRedirectUrl="/entries">
              <button className={`${primaryButton} h-12 px-8`}>Get started free</button>
            </SignUpButton>
            <SignInButton forceRedirectUrl="/entries">
              <button className={`${outlineButton} h-12 px-8`}>Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/create" className={`${primaryButton} h-12 px-8 flex items-center justify-center`}>
              Create entry
            </Link>
          </SignedIn>
        </div>
      </MarketingHero>

      <main className="relative max-w-5xl mx-auto px-6 sm:px-8 pb-24">
        <div className="grid sm:grid-cols-3 gap-8 sm:gap-10 mb-24">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-4 text-primary-brand">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Speak as you coach</h3>
            <p className="text-zinc-500 text-sm">
              During tryouts, practice, or games, talk into your phone or device.
              FilmSesh transcribes and saves each observation so you stay present
              on the court.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-4 text-primary-brand">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">All observations in one place</h3>
            <p className="text-zinc-500 text-sm">
              Every note is captured and organized—by session, player, or topic.
              No more lost scraps of paper or forgotten moments after the whistle.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-4 text-primary-brand">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Key insights, not just notes</h3>
            <p className="text-zinc-500 text-sm">
              FilmSesh analyzes your full set of observations and surfaces what
              matters: standout players, patterns, gaps, and action items so you
              can coach with clarity.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700/50 p-8 sm:p-10 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">
            Ready to coach with a voice AI assistant?
          </h2>
          <p className="text-zinc-500 mb-6 max-w-md mx-auto">
            Sign in to start capturing observations and get insights from every
            tryout, practice, and game.
          </p>
          <SignedOut>
            <SignUpButton forceRedirectUrl="/entries">
              <button className={`${primaryButton} h-11 px-6`}>Create account</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/create"
              className={`inline-flex items-center justify-center ${primaryButton} h-11 px-6`}
            >
              Create entry
            </Link>
          </SignedIn>
        </div>
      </main>
    </div>
  );
}
