import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Intake
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            Collect files from anyone.
            <br />
            Directly into Google Drive.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Create secure file request links. Share them with anyone. Files land
            straight in your Google Drive folder — no account required for
            uploaders.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-base">
                Start collecting files
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t bg-muted/50">
          <div className="mx-auto max-w-6xl px-4 py-24">
            <h2 className="text-center text-3xl font-bold">How it works</h2>
            <div className="mt-16 grid gap-12 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Connect Google Drive
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Sign in with Google and authorize access to your Drive. We
                  never see your existing files.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Create a file request
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Choose a folder, set rules, and get a unique link to share.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  Files land in Drive
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Anyone with the link uploads files. They appear in your Drive
                  folder automatically.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          Intake
        </div>
      </footer>
    </div>
  );
}
