import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-col items-center justify-center p-6 sm:p-24 pt-24 sm:pt-40">
      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-center font-mono text-sm text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 drop-shadow-lg">
          ItsMyScreen Polls
        </h1>
        <p className="text-lg md:text-xl mb-12 max-w-2xl opacity-90">
          Create real-time polls in seconds. Fast, interactive, and completely free.
          Engage your audience with live results.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button asChild size="lg" className="w-full sm:w-auto px-8 py-6 text-lg rounded-full">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-lg rounded-full">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
