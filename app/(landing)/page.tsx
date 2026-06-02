import Link from 'next/link'
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { Mic, ClipboardList, Heart } from 'lucide-react'
import { MarketingHero } from '@/components/marketing/MarketingHero'

const primaryButton =
  'bg-primary-brand hover:bg-primary-brand-hover text-white font-semibold rounded-full transition-colors'
const outlineButton =
  'border border-zinc-600 hover:border-zinc-500 text-zinc-200 rounded-full font-medium transition-colors'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-zinc-100 font-sans">
      <MarketingHero
        eyebrow="Voice-first dog PT care"
        headline={
          <>
            Coordinate <span className="text-primary-brand">Stark&apos;s daily PT</span> by talking to
            the app
          </>
        }
        subheadline="Caregivers speak naturally about stretches, walks, and how your dog is doing. Stark Health transcribes your voice, maps it to today's PT plan, and keeps everyone on the same page."
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignedOut>
            <SignUpButton forceRedirectUrl="/today">
              <button className={`${primaryButton} h-12 px-8`}>Get started</button>
            </SignUpButton>
            <SignInButton forceRedirectUrl="/today">
              <button className={`${outlineButton} h-12 px-8`}>Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/today" className={`${primaryButton} h-12 px-8 flex items-center justify-center`}>
              Open today
            </Link>
          </SignedIn>
        </div>
      </MarketingHero>

      <section className="max-w-3xl mx-auto px-6 py-16 grid gap-10 sm:grid-cols-3">
        <div className="text-center">
          <Mic className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h3 className="font-medium mb-2">Speak, don&apos;t tap</h3>
          <p className="text-sm text-zinc-500">Record a care update in seconds instead of checking boxes.</p>
        </div>
        <div className="text-center">
          <ClipboardList className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h3 className="font-medium mb-2">Daily PT plan</h3>
          <p className="text-sm text-zinc-500">Configurable stretches, workouts, and checkpoints.</p>
        </div>
        <div className="text-center">
          <Heart className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h3 className="font-medium mb-2">Shared care log</h3>
          <p className="text-sm text-zinc-500">Family and walkers see the same structured status.</p>
        </div>
      </section>

      <p className="text-center text-xs text-zinc-600 max-w-md mx-auto px-6 pb-16">
        Stark Health helps organize care notes and PT routines. It does not provide veterinary medical advice.
      </p>
    </div>
  )
}
