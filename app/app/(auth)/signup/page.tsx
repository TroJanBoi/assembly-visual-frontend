// app/(auth)/signup/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup, OAUTH_GOOGLE_URL } from "@/lib/api/auth";

// Sonner for notifications
import { toast } from "sonner";

import LandingNav from "@/components/layout/TopNav";
import { Button } from "@/components/ui/Button";
import { useGlobalLoading } from "@/components/providers/GlobalLoadingProvider";
import AuthDemo from "@/components/ui/Auth/AuthDemo";
import { FaGoogle, FaArrowLeft } from "react-icons/fa6";


export default function SignUpPage() {
  const router = useRouter();

  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [agree, setAgree] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");

  const [loading, setLoading] = useState(false);

  const pwdMismatch = pwd.length > 0 && pwd2.length > 0 && pwd !== pwd2;

  const { show: showGlobalLoading } = useGlobalLoading();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const firstName = String(form.get("firstName") || "").trim();
    const lastName = String(form.get("lastName") || "").trim();
    const email = String(form.get("email") || "").trim();

    if (!agree) return toast.warning("Please accept the terms first.");
    if (!firstName || !lastName) return toast.warning("Please fill first/last name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.warning("Please enter a valid email.");
    if (pwd.length < 8) return toast.warning("Password must be at least 8 characters.");
    if (pwdMismatch) return toast.error("Passwords do not match.");

    try {
      setLoading(true);

      const name = `${firstName} ${lastName}`;
      const res = await signup({ name, email, password: pwd });

      toast.success("Welcome! account created.", {
        description: "Redirecting you to sign in...",
        duration: 2000,
      });

      showGlobalLoading();
      router.push("/signin");
    } catch (err: any) {
      setLoading(false);

      // Backend returns 500 when email exists with message "Failed to register user"
      const isDuplicateUser = err?.status === 500 && err?.message === "Failed to register user";
      const errorMessage = isDuplicateUser
        ? "This email is already registered."
        : (err?.message || "Something went wrong.");

      toast.error("Signup failed", {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col md:flex-row font-sans">
      {/* LEFT: Form Section */}
      {/* LEFT: Visual Side (Hidden on Mobile) */}
      <section className="hidden md:flex flex-1 bg-slate-50 dark:bg-slate-900 p-0 items-center justify-center relative overflow-hidden border-r border-slate-200 dark:border-slate-800">
        {/* Background Patterns */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

        {/* The AuthDemo Component - Full Size */}
        <div className="w-full h-full relative z-10">
          <AuthDemo />
        </div>
      </section>

      {/* RIGHT: Form Section */}
      <section className="flex-1 flex flex-col justify-center px-4 sm:px-8 md:px-12 relative z-10 bg-white dark:bg-slate-950 py-12">
        <div className="absolute top-8 left-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
            <FaArrowLeft /> Back
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="space-y-2">
            <Link href="/" className="inline-block mb-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">BLYLAB<span className="text-indigo-600 dark:text-indigo-400">.</span></h1>
            </Link>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">Create an account</h2>
            <p className="text-slate-500 dark:text-slate-400">Start learning low-level programming today.</p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            {/* Name pair */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="firstName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">First name</label>
                <input
                  id="firstName" name="firstName" required placeholder="John"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label htmlFor="lastName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Last name</label>
                <input
                  id="lastName" name="lastName" required placeholder="Doe"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
              <input
                id="email" name="email" type="email" autoComplete="email" required placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <input
                  id="password" name="password" type={showPwd ? "text" : "password"} minLength={8} required
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-indigo-600 px-2 py-1"
                >
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirm" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirm" name="confirm" type={showPwd2 ? "text" : "password"} minLength={8} required
                  onChange={(e) => setPwd2(e.target.value)}
                  placeholder="Confirm your password"
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500
                        ${pwdMismatch ? "border-red-300 focus:border-red-500" : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd2((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-indigo-600 px-2 py-1"
                >
                  {showPwd2 ? "Hide" : "Show"}
                </button>
              </div>
              {pwdMismatch && <p className="text-xs text-red-600 font-medium">Passwords do not match.</p>}
            </div>


            {/* Terms */}
            <label className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-100 dark:bg-slate-800"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                required
              />
              <span className="leading-snug">
                I agree to the{" "}
                <a href="/terms" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Terms of Service</a>{" "}
                and{" "}
                <a href="/privacy" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</a>.
              </span>
            </label>

            {/* Submit */}
            <Button
              type="submit"
              isLoading={loading}
              disabled={!agree || pwdMismatch}
              loadingText="Creating account..."
              className="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Create Account
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-800" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-950 px-4 text-slate-400 font-medium">Or continue with</span></div>
            </div>

            {/* OAuth */}
            <button
              type="button"
              onClick={() => (window.location.href = OAUTH_GOOGLE_URL)}
              className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <FaGoogle className="text-slate-900 dark:text-white" />
              Sign up with Google
            </button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/signin" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline">Sign In</Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
