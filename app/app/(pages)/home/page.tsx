"use client";

import { useEffect, useState } from "react";
import { getPublicClasses, Class } from "@/lib/api/class";
import ClassCard from "@/components/class/ClassCard"; // Import the new reusable component
import { HiOutlineSparkles } from "react-icons/hi";
import { HiGlobeAsiaAustralia } from "react-icons/hi2";

export default function HomePage() {
  const [publicClasses, setPublicClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedClasses = await getPublicClasses();
        setPublicClasses(fetchedClasses);
      } catch (err: any) {
        setError(err.message || "Failed to fetch public classes.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicClasses();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <p className="text-center text-gray-500">Loading public classes...</p>
      );
    }
    if (error) {
      return <p className="text-center text-red-500">Error: {error}</p>;
    }
    if (publicClasses.length === 0) {
      return (
        <p className="text-center text-gray-500">No public classes found.</p>
      );
    }
    return (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {publicClasses.map((item) => (
          <ClassCard key={item.id} item={item} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <HiGlobeAsiaAustralia className="w-8 h-8 text-indigo-500" />
            <span>Public Classes</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Explore and join public classes available for everyone.
          </p>
        </div>

        {/* Class Grid */}
        {renderContent()}
      </div>
    </div>
  );
}
