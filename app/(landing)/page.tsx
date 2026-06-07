import Link from 'next/link'
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { Mic, ClipboardList, Heart } from 'lucide-react'
import { MarketingHero } from '@/components/marketing/MarketingHero'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <MarketingHero
        eyebrow="Voice-first dog PT care"
        headline={
          <>
            Coordinate <span className="text-primary">Stark&apos;s daily PT</span> by talking to
            the app
          </>
        }
        subheadline="Caregivers speak naturally about stretches, walks, and how your dog is doing. Stark Health transcribes your voice, maps it to today's PT plan, and keeps everyone on the same page."
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignedOut>
            <SignUpButton forceRedirectUrl="/today">
              <Button size="lg" className="rounded-full h-12 px-8">
                Get started
              </Button>
            </SignUpButton>
            <SignInButton forceRedirectUrl="/today">
              <Button variant="outline" size="lg" className="rounded-full h-12 px-8">
                Sign in
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Button asChild size="lg" className="rounded-full h-12 px-8">
              <Link href="/today">Open today</Link>
            </Button>
          </SignedIn>
          <Button asChild variant="ghost" size="lg" className="rounded-full h-12 px-8">
            <Link href="/pricing">View pricing</Link>
          </Button>
        </div>
      </MarketingHero>

      <section className="max-w-3xl mx-auto px-6 py-16 grid gap-10 sm:grid-cols-3">
        <div className="text-center">
          <Mic className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-medium mb-2">Speak, don&apos;t tap</h3>
          <p className="text-sm text-muted-foreground">Record a care update in seconds instead of checking boxes.</p>
        </div>
        <div className="text-center">
          <ClipboardList className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-medium mb-2">Daily PT plan</h3>
          <p className="text-sm text-muted-foreground">Configurable stretches, workouts, and checkpoints.</p>
        </div>
        <div className="text-center">
          <Heart className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-medium mb-2">Shared care log</h3>
          <p className="text-sm text-muted-foreground">Family and walkers see the same structured status.</p>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground max-w-md mx-auto px-6 pb-16">
        Stark Health helps organize care notes and PT routines. It does not provide veterinary medical advice.
      </p>
    </div>
  )
}
