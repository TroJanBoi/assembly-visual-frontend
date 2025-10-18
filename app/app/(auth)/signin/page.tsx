// app/(auth)/signin/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { oauthLogin, signin } from "@/lib/api/auth";

// SweetAlert2
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "sweetalert2/dist/sweetalert2.min.css";
import LandingNav from "@/components/layout/TopNav";

function authSuccess() {
  window.location.href="http://localhost:9090/api/v2/oauth/google/login"
}

const MySwal = withReactContent(Swal);

export default function SignInPage() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const remember = Boolean(form.get("remember"));

    // validate ง่ายๆ
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return MySwal.fire({ icon: "warning", title: "Please enter a valid email." });
    }
    if (!password) {
      return MySwal.fire({ icon: "warning", title: "Please enter your password." });
    }

    try {
      setLoading(true);


      // 🔐 เรียก backend ผ่าน lib/api/auth.ts
      const res = await signin({ email, password, remember });

      await MySwal.fire({
        icon: "success",
        title: "Welcome back 🎉",
        text: res?.user?.email || "Signed in successfully.",
        showConfirmButton: false,
        timer: 1300,
        timerProgressBar: true
      });

      router.push("/home"); // แก้เส้นทางหลังล็อกอินสำเร็จตามต้องการ
    } catch (err: any) {
      MySwal.close();
      MySwal.fire({
        icon: "error",
        title: "Sign in failed",
        text: err?.message || "Invalid credentials.",
        confirmButtonText: "Close",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-800">
      <LandingNav />
      {/* TOP BAR */}

      {/* BODY */}
      <main className="min-h-screen pt-[var(--topbar-height,64px)] flex flex-col gap-6 md:flex-row md:items-center p-6">
        {/* LEFT */}
        <section className="flex-1 rounded-xl p-4">
          <Image
            src="/images/signin-1.png"
            alt="Sign In Illustration"
            width={500}
            height={500}
            className="mx-auto"
            priority
          />
        </section>

        {/* RIGHT */}
        <section className="flex-1 rounded-xl p-4  flex flex-col gap-6 justify-center items-center">
          <div className="w-full max-w-sm space-y-3 text-left">
            <h1 className="text-2xl font-extrabold">
              Welcome back to <span className="text-[var(--color-primary)]">BLYLAB.</span>
            </h1>

            <p className="text-sm text-sub">
              Time to learn! <span className="sr-only">Please</span> Please enter your details.
            </p>

            {/* FORM */}
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Enter your email."
                  className="h-11 w-full rounded-lg border border-[var(--color-border)] px-3
                             text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4
                             focus:ring-[color:rgba(104,127,229,0.18)]"
                />
              </div>

              {/* Password + toggle */}
              <div>
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={show ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password."
                    className="h-11 w-full rounded-lg border border-[var(--color-border)] px-3 pr-10
                               text-sm outline-none focus:border-[var(--color-primary)] focus:ring-4
                               focus:ring-[color:rgba(104,127,229,0.18)]"
                  />
                  <button
                    type="button"
                    aria-label={show ? "Hide password" : "Show password"}
                    aria-pressed={show}
                    onClick={() => setShow((s) => !s)}
                    className="absolute inset-y-0 right-2 my-auto h-7 w-7 rounded-md text-neutral-500 hover:bg-neutral-100 flex items-center justify-center"
                  >
                    {show ? (
                      // Eye-off
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3l18 18" />
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      // Eye
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-sub">
                    <input type="checkbox" name="remember" className="h-4 w-4 align-middle accent-[var(--color-primary)]" />
                    Remember for 30 days
                  </label>
                  <Link
                    href="/forgot"
                    className="text-xs text-[var(--color-primary)] underline underline-offset-2 hover:opacity-90 focus-visible:ring-2"
                  >
                    Forgot password
                  </Link>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium
                           hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? "Processing..." : "Sign In"}
              </button>
            </form>

            {/* OAuth (ถ้ามี route จริงค่อยเชื่อม) */}
            <button
              onClick={() => {
                authSuccess();
              }}
              
              className="h-11 w-full text-sm font-medium border border-[var(--color-border)] rounded-lg hover:bg-neutral-50
                         inline-flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden className="-ml-1 shrink-0">
                <path fill="#4285F4" d="M17.64 9.204c0-.638-.057-1.252-.163-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.797 2.718v2.258h2.908c1.699-1.565 2.685-3.87 2.685-6.617z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.179l-2.908-2.258c-.806.54-1.836.86-3.048.86-2.344 0-4.33-1.58-5.036-3.708H.957v2.332C2.438 15.978 5.481 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.715A5.41 5.41 0 013.684 9c0-.6.103-1.181.28-1.715V4.953H.957A9.01 9.01 0 000 9c0 1.477.354 2.872.957 4.047l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.542c1.322 0 2.512.455 3.447 1.35l2.59-2.59C13.463.86 11.426 0 9 0 5.481 0 2.438 2.022.957 4.953l3.007 2.332C3.67 5.157 5.656 3.542 9 3.542z"/>
              </svg>
              Sign In with Google
            </button>

            <p className="text-center text-xs text-sub">
              Don’t have an account?{" "}
              <Link href="/signup" className="text-[var(--color-primary)] underline underline-offset-2">
                Sign Up
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
