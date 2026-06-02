'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CAMPAIGN_ACCESS_STORAGE_KEY,
  checkCampaignGatePassword,
  grantCampaignAccess,
  isCampaignAccessGranted,
  isCampaignGateEnabled,
  readInitialGateUnlocked
} from '@/lib/campaign-gate'

type Props = {
  children: React.ReactNode
}

export function CampaignAccessGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(readInitialGateUnlocked)
  const [hydrated, setHydrated] = useState(false)
  const [password, setPassword] = useState('')
  const [wrong, setWrong] = useState(false)

  const syncFromStorage = useCallback(() => {
    if (!isCampaignGateEnabled()) {
      setUnlocked(true)
      return
    }
    setUnlocked(isCampaignAccessGranted())
  }, [])

  useEffect(() => {
    syncFromStorage()
    setHydrated(true)

    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === CAMPAIGN_ACCESS_STORAGE_KEY) {
        syncFromStorage()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [syncFromStorage])

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (checkCampaignGatePassword(password)) {
      grantCampaignAccess()
      setWrong(false)
      setUnlocked(true)
      return
    }
    setWrong(true)
  }

  if (!hydrated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#0c0c0c] flex items-center justify-center" aria-hidden />
    )
  }

  if (unlocked) {
    return <>{children}</>
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0c0c0c] flex items-center justify-center px-4">
      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          type="password"
          value={password}
          onChange={e => {
            setPassword(e.target.value)
            setWrong(false)
          }}
          autoComplete="off"
          aria-label="Campaign access password"
          className={`h-11 w-44 sm:w-52 rounded-lg border bg-zinc-900/80 px-3 text-zinc-100 outline-none transition-colors ${
            wrong ? 'border-red-500/60' : 'border-zinc-700 focus:border-primary-brand'
          }`}
        />
        <button
          type="submit"
          aria-label="Submit password"
          className="h-11 min-w-11 rounded-lg bg-primary-brand hover:bg-primary-brand-hover text-white font-medium px-3 transition-colors"
        >
          →
        </button>
      </form>
    </div>
  )
}
