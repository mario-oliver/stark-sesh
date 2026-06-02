'use client'

import * as React from 'react'
import { SignUp, useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function Page() {
  const { isSignedIn, getToken, userId } = useAuth()
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [hasCreatedUser, setHasCreatedUser] = React.useState(false)

  // Automatically create user in backend after successful sign-up
  React.useEffect(() => {
    const createUserInBackend = async () => {
      // Wait for Clerk to fully load and user to be signed in
      if (!isLoaded || !isSignedIn || !user || hasCreatedUser) return

      // Check if user has required fields (first and last name from Clerk)
      const firstName = user.firstName
      const lastName = user.lastName
      const email = user.primaryEmailAddress?.emailAddress

      if (!firstName || !lastName || !email) {
        console.log('Waiting for complete user data from Clerk...')
        return
      }

      try {
        console.log('Creating user in backend...')
        const token = await getToken()

        if (!token) {
          console.error('No auth token available')
          return
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3036'

        const response = await fetch(`${apiUrl}/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            id: userId,
            email: email,
            firstName: firstName,
            lastName: lastName
          })
        })

        if (!response.ok) {
          // Check if user already exists (409 conflict)
          if (response.status === 409) {
            console.log('User already exists in backend')
            setHasCreatedUser(true)
            router.push('/today')
            return
          }

          const errorData = await response.json().catch(() => null)
          console.error('Backend user creation failed:', errorData)
          toast.error('There was an issue setting up your account. Please contact support.')
        } else {
          console.log('User created successfully in backend')
          setHasCreatedUser(true)
          toast.success('Welcome! Your account is ready.')
          // Small delay to show success message
          setTimeout(() => {
            router.push('/today')
          }, 1000)
        }
      } catch (err) {
        console.error('Error creating user in backend:', err)
        // Don't block the user - they can still access the app
        toast.warning('Account created, but there was a sync issue. You can still continue.')
        setTimeout(() => {
          router.push('/today')
        }, 2000)
      }
    }

    createUserInBackend()
  }, [isLoaded, isSignedIn, user, userId, getToken, router, hasCreatedUser])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-lg'
            }
          }}
          // Force sign-up to redirect here so our useEffect can handle backend sync for Google OAuth
          forceRedirectUrl="/sign-up"
          routing="path"
          path="/sign-up"
        />
      </div>
    </div>
  )
}
