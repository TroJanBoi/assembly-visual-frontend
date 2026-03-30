import AuthGuard from "@/components/providers/AuthGuard";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {children}
      </div>
    </AuthGuard>
  );
}
