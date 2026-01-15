// app/(auth)/signup/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/api/auth";

// Phone input (Flag + Country)
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

// SweetAlert2 (popup)
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "sweetalert2/dist/sweetalert2.min.css";

import LandingNav from "@/components/layout/TopNav";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { useGlobalLoading } from "@/components/providers/GlobalLoadingProvider";
import AuthDemo from "@/components/ui/Auth/AuthDemo";
import { FaGoogle, FaArrowLeft } from "react-icons/fa6";

const MySwal = withReactContent(Swal);

function PhoneField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">Phone number</label>
      <div className="mt-1.5">
        <PhoneInput
          country="th"
          value={value}
          onChange={onChange}
          enableSearch
          inputProps={{ name: "tel", required: true, autoFocus: false }}
          containerClass="!w-full"
          inputClass="!w-full !h-[46px] !text-sm !rounded-xl !border !border-slate-200 !bg-slate-50 !px-3 font-medium placeholder:text-slate-400
                      focus:!border-indigo-500 focus:!ring-2 focus:!ring-indigo-500/20 !outline-none !transition-all"
          buttonClass="!border-slate-200 !bg-slate-100 !rounded-l-xl hover:!bg-slate-200"
          dropdownClass="!z-50 !shadow-lg !rounded-xl !border-slate-100"
        />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();

  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [agree, setAgree] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);

  const pwdMismatch = pwd.length > 0 && pwd2.length > 0 && pwd !== pwd2;

  const { show: showGlobalLoading } = useGlobalLoading();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const firstName = String(form.get("firstName") || "").trim();
    const lastName = String(form.get("lastName") || "").trim();
    const email = String(form.get("email") || "").trim();
    const tel = "+" + String(phone).replace(/\D/g, ""); // E.164

    if (!agree) return MySwal.fire({ icon: "warning", title: "Please accept the terms first.", toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    if (!firstName || !lastName) return MySwal.fire({ icon: "warning", title: "Please fill first/last name.", toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return MySwal.fire({ icon: "warning", title: "Please enter a valid email.", toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    if (pwd.length < 8) return MySwal.fire({ icon: "warning", title: "Password must be at least 8 characters.", toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    if (pwdMismatch) return MySwal.fire({ icon: "error", title: "Passwords do not match.", toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });

    try {
      setLoading(true);

      const name = `${firstName} ${lastName}`;
      const res = await signup({ name, email, password: pwd, tel });

      await MySwal.fire({
        icon: "success",
        title: "Welcome! account created.",
        text: "Redirecting you to sign in...",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        toast: true, position: 'top-end'
      });

      showGlobalLoading(); 
      router.push("/signin");
    } catch (err: any) {
      setLoading(false);
      MySwal.fire({
        icon: "error",
        title: "Signup failed",
        text: err?.message || "Something went wrong.",
        confirmButtonText: "Close",
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
      <section className="flex-1 flex flex-col justify-center px-4 sm:px-8 md:px-12 relative z-10 bg-white py-12">
        <div className="absolute top-8 left-8">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                <FaArrowLeft /> Back
            </Link>
        </div>

        <div className="max-w-md w-full mx-auto space-y-6">
            <div className="space-y-2">
                <Link href="/" className="inline-block mb-2">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">BLYLAB<span className="text-indigo-600">.</span></h1>
                </Link>
                <h2 className="text-3xl font-bold text-slate-900 leading-tight">Create an account</h2>
                <p className="text-slate-500">Start learning low-level programming today.</p>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
                {/* Name pair */}
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex-1 space-y-1.5">
                    <label htmlFor="firstName" className="text-sm font-semibold text-slate-700">First name</label>
                    <input
                      id="firstName" name="firstName" required placeholder="John"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label htmlFor="lastName" className="text-sm font-semibold text-slate-700">Last name</label>
                    <input
                      id="lastName" name="lastName" required placeholder="Doe"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</label>
                  <input
                    id="email" name="email" type="email" autoComplete="email" required placeholder="name@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <input
                      id="password" name="password" type={showPwd ? "text" : "password"} minLength={8} required
                      onChange={(e) => setPwd(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium placeholder:text-slate-400"
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
                  <label htmlFor="confirm" className="text-sm font-semibold text-slate-700">Confirm Password</label>
                  <div className="relative">
                    <input
                      id="confirm" name="confirm" type={showPwd2 ? "text" : "password"} minLength={8} required
                      onChange={(e) => setPwd2(e.target.value)}
                      placeholder="Confirm your password"
                      className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium placeholder:text-slate-400
                        ${pwdMismatch ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-indigo-500"}`}
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

                {/* Phone */}
                <PhoneField value={phone} onChange={setPhone} />

                {/* Terms */}
                <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-slate-100"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    required
                  />
                  <span className="leading-snug">
                    I agree to the{" "}
                    <a href="/terms" className="font-semibold text-indigo-600 hover:underline">Terms of Service</a>{" "}
                    and{" "}
                    <a href="/privacy" className="font-semibold text-indigo-600 hover:underline">Privacy Policy</a>.
                  </span>
                </label>

                {/* Submit */}
                <LoadingButton
                  type="submit"
                  isLoading={loading}
                  disabled={!agree || pwdMismatch}
                  loadingText="Creating account..."
                  className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  Create Account
                </LoadingButton>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-medium">Or continue with</span></div>
                </div>

                {/* OAuth */}
                <button
                  type="button"
                  onClick={() => (window.location.href = "/api/auth/signin/google")}
                  className="w-full py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <FaGoogle className="text-slate-900" />
                  Sign up with Google
                </button>

                <p className="text-center text-sm text-slate-600">
                  Already have an account?{" "}
                  <Link href="/signin" className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">Sign In</Link>
                </p>
            </form>
        </div>
      </section>
    </div>
  );
}
