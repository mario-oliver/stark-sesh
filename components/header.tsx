import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

const NavBar = () => {
  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-6 sm:px-8 h-16 border-b border-border bg-background/80 backdrop-blur-sm">
      <Link
        href="/"
        className="text-lg font-semibold text-primary hover:text-primary/80 transition-colors"
      >
        Stark Health
      </Link>
      <nav className="flex items-center gap-2 sm:gap-3">
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
          <Link
            href="/today"
            className="text-muted-foreground hover:text-accent-foreground hover:bg-accent/60 rounded-md px-2 py-1 text-sm font-medium transition-colors"
          >
            Today
          </Link>
          <Link
            href="/tasks"
            className="text-muted-foreground hover:text-accent-foreground hover:bg-accent/60 rounded-md px-2 py-1 text-sm font-medium hidden sm:inline transition-colors"
          >
            Tasks
          </Link>
          <Link
            href="/calendar"
            className="text-muted-foreground hover:text-accent-foreground hover:bg-accent/60 rounded-md px-2 py-1 text-sm font-medium hidden sm:inline transition-colors"
          >
            Calendar
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
