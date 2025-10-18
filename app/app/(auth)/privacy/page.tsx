// app/privacy/page.tsx
"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-800 p-6 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-[var(--color-primary)]">Privacy Policy</h1>
          <p className="text-sm text-sub mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </header>

        <section className="space-y-6 text-sm leading-6">
          <p>
            BLYLAB respects your privacy and is committed to protecting your personal data.
            This privacy policy explains how we collect, use, and safeguard your information
            when you use our platform.
          </p>

          <h2 className="text-lg font-semibold text-[var(--color-primary)]">1. Information We Collect</h2>
          <p>
            We may collect your name, email, and contact details when you sign up or interact
            with our services. We also collect usage data to improve user experience.
          </p>

          <h2 className="text-lg font-semibold text-[var(--color-primary)]">2. How We Use Your Information</h2>
          <p>
            Your information is used solely for authentication, service improvement,
            and communication about product updates or support.
          </p>

          <h2 className="text-lg font-semibold text-[var(--color-primary)]">3. Data Protection</h2>
          <p>
            We take appropriate security measures to prevent unauthorized access or misuse
            of your personal information.
          </p>

          <h2 className="text-lg font-semibold text-[var(--color-primary)]">4. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
            <span className="block mt-1 text-indigo-600">support@blylab.com</span>
          </p>

          <p className="mt-6 text-sm">
            <Link href="/" className="text-[var(--color-primary)] underline underline-offset-2">
              ← Back to Home
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
