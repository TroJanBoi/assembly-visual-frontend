// app/terms/page.tsx
"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-800 p-6 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-[var(--color-primary)]">Terms of Service</h1>
          <p className="text-sm text-sub mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </header>

        <section className="space-y-6 text-sm leading-6">
          <p>
            By accessing or using BLYLAB, you agree to comply with these Terms of Service.
            Please read them carefully before using our platform.
          </p>

          <h2 className="text-lg font-semibold text-[var(--color-primary)]">1. Use of the Service</h2>
          <p>
            You agree to use the platform only for lawful purposes and in accordance with
            applicable regulations.
          </p>

          <h2 className="text-lg font-semibold text-[var(--color-primary)]">2. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account and
            password and for restricting access to your account.
          </p>

          <h2 className="text-lg font-semibold text-[var(--color-primary)]">3. Intellectual Property</h2>
          <p>
            All content, designs, and trademarks are owned by BLYLAB and protected under
            intellectual property laws.
          </p>

          <h2 className="text-lg font-semibold text-[var(--color-primary)]">4. Limitation of Liability</h2>
          <p>
            BLYLAB shall not be liable for any indirect, incidental, or consequential damages
            arising from your use of the service.
          </p>

          <h2 className="text-lg font-semibold text-[var(--color-primary)]">5. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of the service
            after updates constitutes acceptance of the revised terms.
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
