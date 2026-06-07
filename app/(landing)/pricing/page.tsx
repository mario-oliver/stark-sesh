'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { MarketingHero } from '@/components/marketing/MarketingHero'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/hooks/use-subscription'

const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? ''
const BASIC_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC ?? ''

function PlanCard({
  name,
  price,
  description,
  features,
  priceId,
  highlighted,
  hasPro,
  hasBasic,
  subscribe,
  openPortal
}: {
  name: string
  price: string
  description: string
  features: string[]
  priceId: string
  highlighted?: boolean
  hasPro: boolean
  hasBasic: boolean
  subscribe: (priceId: string) => Promise<void>
  openPortal: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)

  const isCurrent =
    (name === 'Pro' && hasPro) || (name === 'Basic' && hasBasic && !hasPro)

  async function handleSubscribe() {
    if (!priceId) {
      toast.error('Pricing is not configured yet.')
      return
    }
    setBusy(true)
    try {
      if (isCurrent) {
        await openPortal()
      } else {
        await subscribe(priceId)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start checkout')
      setBusy(false)
    }
  }

  return (
    <div
      className={`rounded-2xl border p-6 flex flex-col gap-4 ${
        highlighted ? 'border-primary shadow-lg bg-card' : 'border-border bg-card/50'
      }`}
    >
      <div>
        <h2 className="text-xl font-semibold">{name}</h2>
        <p className="text-3xl font-bold mt-2">{price}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <ul className="space-y-2 flex-1">
        {features.map(feature => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <SignedIn>
        <Button
          className="w-full rounded-full"
          variant={highlighted ? 'default' : 'outline'}
          disabled={busy || (!priceId && !isCurrent)}
          onClick={() => void handleSubscribe()}
        >
          {busy ? 'Loading…' : isCurrent ? 'Manage subscription' : `Subscribe to ${name}`}
        </Button>
      </SignedIn>
      <SignedOut>
        <SignInButton forceRedirectUrl="/pricing">
          <Button className="w-full rounded-full" variant={highlighted ? 'default' : 'outline'}>
            Sign in to subscribe
          </Button>
        </SignInButton>
      </SignedOut>
    </div>
  )
}

export default function PricingPage() {
  const { hasPro, hasBasic, subscribe, openPortal } = useSubscription()

  return (
    <div className="min-h-screen bg-background">
      <MarketingHero
        eyebrow="Plans"
        headline="Simple pricing for daily dog PT care"
        subheadline="Subscribe on the web with Stripe. iOS subscribers can use the same account with App Store billing."
        align="center"
      >
        <Button asChild variant="ghost" className="rounded-full">
          <Link href="/">Back to home</Link>
        </Button>
      </MarketingHero>

      <section className="max-w-4xl mx-auto px-6 pb-20 grid gap-6 md:grid-cols-2">
        <PlanCard
          name="Basic"
          price="$9/mo"
          description="Core care tracking for one dog."
          priceId={BASIC_PRICE_ID}
          hasPro={hasPro}
          hasBasic={hasBasic}
          subscribe={subscribe}
          openPortal={openPortal}
          features={[
            'Daily care log with voice updates',
            'Activity, mobility, and recovery buckets',
            'Shared access for caregivers'
          ]}
        />
        <PlanCard
          name="Pro"
          price="$19/mo"
          description="Advanced insights and priority features."
          priceId={PRO_PRICE_ID}
          highlighted
          hasPro={hasPro}
          hasBasic={hasBasic}
          subscribe={subscribe}
          openPortal={openPortal}
          features={[
            'Everything in Basic',
            'LLM-powered mobility and recovery scores',
            'Exercise agent for custom PT routines',
            'Priority support'
          ]}
        />
      </section>
    </div>
  )
}
