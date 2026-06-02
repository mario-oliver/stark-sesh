import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

const NavBar = () => {
  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-6 sm:px-8 h-16 border-b border-zinc-800 bg-[#0c0c0c]/80 backdrop-blur-sm">
      <Link
        href="/"
        className="text-lg font-semibold text-zinc-100 hover:text-primary-brand transition-colors"
      >
        FilmSesh
      </Link>
      <nav className="flex items-center gap-3">
        <SignedOut>
          <SignInButton forceRedirectUrl="/entries">
            <button className="text-zinc-400 hover:text-zinc-200 text-sm font-medium">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton forceRedirectUrl="/entries">
            <button className="bg-primary-brand hover:bg-primary-brand-hover text-white rounded-full font-medium text-sm h-9 px-4 cursor-pointer transition-colors">
              Sign up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link
            href="/campaigns"
            className="text-zinc-400 hover:text-zinc-200 text-sm font-medium hidden sm:inline"
          >
            Campaigns
          </Link>
          <Link
            href="/entries"
            className="text-zinc-400 hover:text-zinc-200 text-sm font-medium"
          >
            Entries
          </Link>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </SignedIn>
      </nav>
    </header>
  );
};

export default NavBar
