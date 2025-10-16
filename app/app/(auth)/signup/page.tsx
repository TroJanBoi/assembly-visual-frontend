// app/(auth)/signup/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signup } from "@/lib/api/auth";

// Phone input (ธง+ประเทศครบ)
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

// SweetAlert2 (popup)
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "sweetalert2/dist/sweetalert2.min.css";

import LandingNav from "@/components/layout/TopNav";

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
      <label className="text-sm font-medium">Phone number</label>
      <div className="mt-1">
        <PhoneInput
          country="th"
          value={value}
          onChange={onChange}
          enableSearch
          inputProps={{ name: "tel", required: true, autoFocus: false }}
          containerClass="!w-full"
          inputClass="!w-full !h-11 !text-sm !rounded-lg !border !border-[var(--color-border)] !px-3
                      focus:!border-[var(--color-primary)] focus:!ring-4 focus:!ring-[color:rgba(104,127,229,0.18)]"
          buttonClass="!border-[var(--color-border)] !bg-white !rounded-l-lg"
          dropdownClass="!z-50"
        />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const pathname = usePathname();
  const router = useRouter();

  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [agree, setAgree] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);

  const pwdMismatch = pwd.length > 0 && pwd2.length > 0 && pwd !== pwd2;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const firstName = String(form.get("firstName") || "").trim();
    const lastName  = String(form.get("lastName")  || "").trim();
    const email     = String(form.get("email")     || "").trim();
    const tel       = "+" + String(phone).replace(/\D/g, ""); // E.164

    // validate ด่วนๆ
    if (!agree)       return MySwal.fire({ icon: "warning", title: "Please accept the terms first." });
    if (!firstName || !lastName) return MySwal.fire({ icon: "warning", title: "Please fill first/last name." });
    if (!/^\S+@\S+\.\S+$/.test(email)) return MySwal.fire({ icon: "warning", title: "Please enter a valid email." });
    if (pwd.length < 8) return MySwal.fire({ icon: "warning", title: "Password must be at least 8 characters." });
    if (pwdMismatch)    return MySwal.fire({ icon: "error",   title: "Passwords do not match." });

    try {
      setLoading(true);
      // await MySwal.fire({
      //   title: "Processing...",
      //   allowOutsideClick: false,
      //   didOpen: () => { MySwal.showLoading(); },
      // });

      const name = `${firstName} ${lastName}`;
      const res = await signup({ name, email, password: pwd, tel });

      await MySwal.fire({
        icon: "success",
        title: "Welcome 🎉",
        text: `Signup success: ${res?.email || name}`,
        // confirmButtonText: "Go to Sign In",
        showConfirmButton: false,
        timer: 1300,
        timerProgressBar: true
      });

      router.push("/signin");
    } catch (err: any) {
      MySwal.close();
      MySwal.fire({
        icon: "error",
        title: "Signup failed",
        text: err?.message || "Something went wrong.",
        confirmButtonText: "Close",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-800">

      {/* TOP BAR */}
      <LandingNav />
      {/* <header className="h-14 flex items-center justify-between px-6 border-gray-200 shadow-sm bg-white">
        <Link href="/" className="font-extrabold tracking-tight text-xl">
          <span className="text-indigo-500">BLYLAB.</span>
        </Link>

        <nav className="flex items-center gap-2 text-sm font-bold">
          <Link
            href="/signin"
            className={`px-3 py-1 rounded-md transition ${
              pathname === "/signin"
                ? "bg-indigo-500 text-white"
                : "text-indigo-500 hover:bg-indigo-100"
            }`}
          >
            SIGN IN
          </Link>

          <Link
            href="/signup"
            className={`px-3 py-1 rounded-md transition ${
              pathname === "/signup"
                ? "bg-indigo-500 text-white"
                : "text-indigo-500 hover:bg-indigo-100"
            }`}
          >
            SIGN UP
          </Link>
        </nav>
      </header> */}

      {/* BODY */}
      <main className="min-h-screen pt-[var(--topbar-height,64px)] flex flex-col gap-6 md:flex-row md:items-center p-6">

        {/* LEFT */}
        <section className="flex-1 rounded-xl p-4">
          <Image
            src="/images/signin-1.png"
            alt="Sign Up Illustration"
            width={500}
            height={500}
            className="mx-auto"
            priority
          />
        </section>

        {/* RIGHT */}
        <section className="flex-1 rounded-xl p-4 flex flex-col gap-6 justify-center items-center">
          <div className="w-full text-neutral-800 flex justify-center p-6 md:p-0">
            <div className="w-full max-w-sm">
              <h1 className="text-2xl font-extrabold">
                Welcome to <span className="text-[var(--color-primary)]">BLYLAB</span>.
              </h1>
              <p className="mt-1 text-sm text-sub">Time to learn! Please enter your details.</p>

              {/* FORM */}
              <form className="mt-5 space-y-4" onSubmit={onSubmit}>
                {/* Name pair */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <label htmlFor="firstName" className="text-sm font-medium">First name</label>
                    <input
                      id="firstName" name="firstName" required placeholder="Enter your first name"
                      className="mt-1 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm
                                 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[color:rgba(104,127,229,0.18)]"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
                    <input
                      id="lastName" name="lastName" required placeholder="Enter your last name"
                      className="mt-1 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm
                                 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[color:rgba(104,127,229,0.18)]"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <input
                    id="email" name="email" type="email" autoComplete="email" required placeholder="Enter your email"
                    className="mt-1 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm
                               outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[color:rgba(104,127,229,0.18)]"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <input
                      id="password" name="password" type={showPwd ? "text" : "password"} minLength={8} required
                      onChange={(e) => setPwd(e.target.value)}
                      placeholder="Enter your password"
                      className="mt-1 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 pr-12 text-sm
                                 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[color:rgba(104,127,229,0.18)]"
                    />
                    <button
                      type="button" aria-label={showPwd ? "Hide password" : "Show password"}
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md flex items-center justify-center
                                 text-neutral-500 hover:text-[var(--color-primary)] hover:bg-neutral-100"
                    >
                      {showPwd ? (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 3l18 18" /><path d="M10.5 10.5a3 3 0 104.2 4.2" />
                          <path d="M2 12s4-7 10-7c1.1 0 2.2.2 3.2.5" /><path d="M22 12s-4 7-10 7c-1.2 0-2.3-.2-3.3-.6" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirm" className="text-sm font-medium">Confirm Password</label>
                  <div className="relative">
                    <input
                      id="confirm" name="confirm" type={showPwd2 ? "text" : "password"} minLength={8} required
                      onChange={(e) => setPwd2(e.target.value)}
                      placeholder="Enter your confirm password"
                      className={`mt-1 h-11 w-full rounded-lg border px-3 pr-12 text-sm outline-none
                        ${pwdMismatch ? "border-red-300 focus:border-red-500 focus:ring-red-200" :
                        "border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[color:rgba(104,127,229,0.18)]"}`}
                    />
                    <button
                      type="button" aria-label={showPwd2 ? "Hide password" : "Show password"}
                      onClick={() => setShowPwd2((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md flex items-center justify-center
                                 text-neutral-500 hover:text-[var(--color-primary)] hover:bg-neutral-100"
                    >
                      {showPwd2 ? (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 3l18 18" /><path d="M10.5 10.5a3 3 0 104.2 4.2" />
                          <path d="M2 12s4-7 10-7c1.1 0 2.2.2 3.2.5" /><path d="M22 12s-4 7-10 7c-1.2 0-2.3-.2-3.3-.6" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {pwdMismatch && <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>}
                </div>

                {/* Phone */}
                <PhoneField value={phone} onChange={setPhone} />

                {/* Terms */}
                <label className="mt-3 inline-flex items-start gap-3 text-sm text-sub select-none">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded accent-[var(--color-primary)]"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    required
                  />
                  <span className="leading-6">
                    I agree to the{" "}
                    <a href="/terms" className="text-[var(--color-primary)] underline underline-offset-2">terms of service</a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-[var(--color-primary)] underline underline-offset-2">privacy policy</a>.
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!agree || pwdMismatch || loading}
                  className="h-11 w-full rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium
                             hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {loading ? "Processing..." : "Sign Up"}
                </button>

                {/* OAuth (ตัวอย่างปุ่ม) */}
                <button
                  type="button"
                  onClick={() => (window.location.href = "/api/auth/signin/google")}
                  className="h-11 w-full rounded-lg border border-[var(--color-border)] bg-white text-sm font-medium hover:bg-neutral-50
                             inline-flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden className="-ml-1 shrink-0">
                    <path fill="#4285F4" d="M17.64 9.204c0-.638-.057-1.252-.163-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.797 2.718v2.258h2.908c1.699-1.565 2.685-3.87 2.685-6.617z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.179l-2.908-2.258c-.806.54-1.836.86-3.048.86-2.344 0-4.33-1.58-5.036-3.708H.957v2.332C2.438 15.978 5.481 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.715A5.41 5.41 0 013.684 9c0-.6.103-1.181.28-1.715V4.953H.957A9.01 9.01 0 000 9c0 1.477.354 2.872.957 4.047L3.964 10.715z"/>
                    <path fill="#EA4335" d="M9 3.542c1.322 0 2.512.455 3.447 1.35l2.59-2.59C13.463.86 11.426 0 9 0 5.481 0 2.438 2.022.957 4.953l3.007 2.332C3.67 5.157 5.656 3.542 9 3.542z"/>
                  </svg>
                  Sign In with Google
                </button>

                <p className="text-center text-xs text-sub">
                  Already have an account?{" "}
                  <Link href="/signin" className="text-[var(--color-primary)] underline underline-offset-2">Sign In</Link>
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
