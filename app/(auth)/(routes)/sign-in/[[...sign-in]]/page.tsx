import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <SignIn
      // Force sign-up to redirect here so our useEffect can handle backend sync for Google OAuth
      forceRedirectUrl="/sign-up"
      routing="path"
      path="/sign-in"
    />
  )
}
