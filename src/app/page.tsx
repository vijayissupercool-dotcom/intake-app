import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center transition-opacity hover:opacity-90"
          >
            <img
              src="/intake_logowithname.png"
              alt="Intake"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
            <img
              src="/intake_logo_only.png"
              alt="Intake icon"
              className="h-4 w-4 rounded-[4px] object-cover shadow-xs"
            />
            <span>Direct-to-Drive File Requests</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Collect files from anyone.
            <br />
            <span className="text-primary">Directly into Google Drive.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Create secure file request links. Share them with anyone. Files land
            straight in your Google Drive folder — no account required for
            uploaders.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-11 px-8 text-base shadow-sm">
                Start collecting files
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t bg-muted/40 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              How it works
            </h2>
            <div className="mt-16 grid gap-8 sm:gap-12 md:grid-cols-3">
              <div className="rounded-xl border bg-card p-6 text-center shadow-xs">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-xs">
                  1
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  Connect Google Drive
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Sign in with Google and authorize access to your Drive. We
                  never see your existing files.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6 text-center shadow-xs">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-xs">
                  2
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  Create a file request
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Choose a folder, set rules, and get a unique link to share with
                  clients, team members, or partners.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-6 text-center shadow-xs">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shadow-xs">
                  3
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  Files land in Drive
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Anyone with the link uploads files. They appear in your Drive
                  folder automatically.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <Link
            href="/"
            className="flex items-center transition-opacity hover:opacity-90"
          >
            <img
              src="/intake_logowithname.png"
              alt="Intake"
              className="h-6 w-auto object-contain"
            />
          </Link>
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} Intake. All rights reserved. Direct-to-Drive file collection.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
