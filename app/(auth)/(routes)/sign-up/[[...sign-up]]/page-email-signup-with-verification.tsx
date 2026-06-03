'use client'

import * as React from 'react'
import { useSignUp, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function Page() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const { getToken } = useAuth()
  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [verifying, setVerifying] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [creatingBackendUser, setCreatingBackendUser] = React.useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoaded) {
      toast.error('Authentication not ready. Please try again.')
      return
    }

    if (!emailAddress.trim() || !password.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match. Please try again.')
      return
    }

    try {
      await signUp.create({
        emailAddress,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined
      })

      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code'
      })

      setVerifying(true)
      toast.success('Verification code sent to your email')
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2))

      if (err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors)) {
        const clerkError = err as { errors: Array<{ longMessage: string }> }
        toast.error(clerkError.errors[0]?.longMessage || 'Failed to create account. Please try again.')
      } else if (err && typeof err === 'object' && 'message' in err) {
        toast.error((err as Error).message)
      } else {
        toast.error('Failed to create account. Please try again.')
      }
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoaded) return

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code
      })

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })

        const token = await getToken()

        if (!token) {
          console.warn('Missing authentication token after session activation')
          setCreatingBackendUser(false)
          toast.error('Authentication failed. Please try signing up again.')
          return
        }

        setCreatingBackendUser(true)
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3036'

          const response = await fetch(`${apiUrl}/v1/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              id: signUpAttempt.createdUserId!,
              email: emailAddress,
              firstName: firstName || undefined,
              lastName: lastName || undefined
            })
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => null)
            console.error('Backend user creation failed:', errorData)
            toast.warning('Account created, but some features may need setup.')
          } else {
            console.log('User created successfully in backend')
            toast.success('Account created successfully!')
          }
        } catch (backendError: unknown) {
          console.error('Failed to create user in backend:', backendError)
          toast.warning('Account created, but some features may need setup.')
        } finally {
          setCreatingBackendUser(false)
        }

        router.push('/today')
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2))
        toast.error('Email verification incomplete. Please try again.')
      }
    } catch (err: unknown) {
      console.error('Error:', JSON.stringify(err, null, 2))
      toast.error('Verification failed. Please try again.')
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Verify your email</h1>
            <p className="text-lg text-muted-foreground">Enter the verification code sent to your email</p>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-lg p-8">
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  name="code"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Enter your verification code"
                  required
                />
              </div>
              <div>
                <Button type="submit" disabled={creatingBackendUser} className="w-full">
                  {creatingBackendUser ? 'Setting up your account...' : 'Verify Email'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Sign up for Stark Health</h1>
          <p className="text-lg text-muted-foreground">Create your account to coordinate your dog&apos;s PT care</p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                name="firstName"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Enter your first name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                name="lastName"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Enter your last name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={emailAddress}
                onChange={e => setEmailAddress(e.target.value)}
                placeholder="your-email@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a secure password"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>
            <div>
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
