// app/(auth)/signin/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signin } from "@/lib/api/auth";

// SweetAlert2
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "sweetalert2/dist/sweetalert2.min.css";
import LandingNav from "@/components/layout/TopNav";

import { LoadingButton } from "@/components/ui/LoadingButton";
import { useGlobalLoading } from "@/components/providers/GlobalLoadingProvider";
import AuthDemo from "@/components/ui/Auth/AuthDemo";
import { FaGoogle, FaArrowLeft } from "react-icons/fa6";

const MySwal = withReactContent(Swal);

export default function SignInPage() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { show: showGlobalLoading } = useGlobalLoading();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const remember = Boolean(form.get("remember"));

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return MySwal.fire({
        icon: "warning",
        title: "Please enter a valid email.",
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
      });
    }
    if (!password) {
      return MySwal.fire({
        icon: "warning",
        title: "Please enter your password.",
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
      });
    }

    try {
      setLoading(true);
      const res = await signin({ email, password, remember });

      await MySwal.fire({
        icon: "success",
        title: "Welcome back!",
        text: "Redirecting to your workspace...",
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true
      });

      showGlobalLoading();
      router.push("/home");
    } catch (err: any) {
      setLoading(false);
      MySwal.fire({
        icon: "error",
        title: "Sign in failed",
        text: err?.message || "Invalid credentials.",
        confirmButtonText: "Try Again",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans">
      {/* LEFT: Form Section */}
      {/* LEFT: Visual Side (Hidden on Mobile) */}
      <section className="hidden md:flex flex-1 bg-slate-50 p-0 items-center justify-center relative overflow-hidden border-r border-slate-200">
        {/* Background Patterns */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
        
        {/* The AuthDemo Component - Full Size */}
        <div className="w-full h-full relative z-10">
            <AuthDemo />
        </div>
      </section>

      {/* RIGHT: Form Section */}
      <section className="flex-1 flex flex-col justify-center px-4 sm:px-8 md:px-12 relative z-10 bg-white">
        <div className="absolute top-8 left-8">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                <FaArrowLeft /> Back
            </Link>
        </div>

        <div className="max-w-md w-full mx-auto space-y-8">
            <div className="space-y-2">
                <Link href="/" className="inline-block mb-4">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">BLYLAB<span className="text-indigo-600">.</span></h1>
                </Link>
                <h2 className="text-3xl font-bold text-slate-900 leading-tight">Welcome back</h2>
                <p className="text-slate-500">Please enter your details to sign in.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="email">Email</label>
                    <input 
                        id="email" 
                        name="email" 
                        type="email" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400"
                        placeholder="name@example.com"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700" htmlFor="password">Password</label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={show ? "text" : "password"}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400"
                            placeholder="••••••••"
                        />
                         <button
                            type="button"
                            onClick={() => setShow(!show)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-indigo-600 px-2 py-1"
                        >
                            {show ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input type="checkbox" name="remember" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        Remember me
                    </label>
                    <Link href="/forgot" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                        Forgot password?
                    </Link>
                </div>

                <LoadingButton
                    type="submit"
                    isLoading={loading}
                    loadingText="Signing In..."
                    className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    Sign In
                </LoadingButton>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-medium">Or continue with</span></div>
            </div>

            <button
                type="button"
                className="w-full py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                onClick={() => {
                     window.location.href = "http://localhost:9090/api/v2/oauth/google/login";
                }}
            >
                <FaGoogle className="text-slate-900" />
                Google
            </button>

            <p className="text-center text-sm text-slate-600">
                Don’t have an account?{" "}
                <Link href="/signup" className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                    Sign up for free
                </Link>
            </p>
        </div>
      </section>
    </div>
  );
}
