"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Check session on mount and when pathname changes
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      }
    };
    checkSession();
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  if (pathname === "/login" || pathname === "/signup") return null;

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          ItsMyScreen
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard" className={`text-sm font-medium transition-colors ${pathname === '/dashboard' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}>
                Dashboard
              </Link>
              <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-100">
                <span className="text-sm font-semibold text-gray-700 hidden md:block">
                  {user.name}
                </span>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-500 hover:text-red-500 hover:bg-red-50">
                  <LogOut size={20} />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-gray-600 hover:text-indigo-600">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
