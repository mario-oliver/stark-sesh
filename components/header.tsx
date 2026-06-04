import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { HeaderNav } from "@/components/header-nav";

const NavBar = () => {
  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-4 sm:px-8 h-16 border-b border-border bg-background/80 backdrop-blur-sm">
      <Link
        href="/"
        className="text-lg font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
      >
        Stark Health
      </Link>
      <nav className="flex items-center gap-1 sm:gap-2">
        <ModeToggle />
        <SignedOut>
          <SignInButton forceRedirectUrl="/today">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton forceRedirectUrl="/today">
            <Button size="sm" className="rounded-full">
              Sign up
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <HeaderNav />
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
