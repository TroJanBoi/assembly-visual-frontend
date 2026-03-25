"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { HiChevronRight } from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import CreateClassModal from "@/components/class/CreateClassModal";
import { getMyClasses, getJoinedClasses, Class } from "@/lib/api/class";
import { toast } from "sonner";
import ClassCard from "@/components/class/ClassCard";
import ClassCardSkeleton from "@/components/skeletons/ClassCardSkeleton";
import CreateCard from "@/components/class/CreateCard";
import JoinPrivateCard from "@/components/class/JoinPrivateCard";

export default function ClassPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [joinedClasses, setJoinedClasses] = useState<Class[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [joinedLoading, setJoinedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      setError(null);
      const [owned, joined] = await Promise.all([
        getMyClasses(),
        getJoinedClasses(),
      ]);
      setMyClasses(owned || []);
      setJoinedClasses(joined || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch classes.");
      toast.error("Error", {
        description: err.message || "Failed to fetch classes.",
      });
    } finally {
      setPageLoading(false);
    }
  }, []);

  // Refresh only the joined classes list (used after joining)
  const refreshJoinedClasses = useCallback(async () => {
    setJoinedLoading(true);
    try {
      const joined = await getJoinedClasses();
      setJoinedClasses(joined || []);
    } catch (err: any) {
      toast.error("Failed to refresh classes.");
    } finally {
      setJoinedLoading(false);
    }
  }, []);

  useEffect(() => {
    setPageLoading(true);
    fetchClasses();
  }, [fetchClasses]);

  if (pageLoading) {
    return (
      <div className=" min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <Section title="My Classes" viewAllHref="/class/my" leadingCard={<CreateCard onOpen={() => { }} />}>
            {[...Array(3)].map((_, i) => <ClassCardSkeleton key={i} />)}
          </Section>
          <Section title="Joined Classes" viewAllHref="/class/join" leadingCard={<div className="h-56 rounded-2xl bg-gray-100 animate-pulse" />}>
            {[...Array(3)].map((_, i) => <ClassCardSkeleton key={i} />)}
          </Section>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  const displayedMyClasses = myClasses.slice(0, 3);
  const displayedJoinedClasses = joinedClasses.slice(0, 3);

  return (
    <div className=" min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-12">
          <Section
            title="My Classes"
            viewAllHref="/class/my"
            leadingCard={<CreateCard onOpen={() => setCreateModalOpen(true)} />}
          >
            {displayedMyClasses.map((item) => (
              <ClassCard key={item.id} item={item} />
            ))}
          </Section>

          <Section
            title="Joined Classes"
            viewAllHref="/class/join"
            leadingCard={
              <JoinPrivateCard onJoinSuccess={refreshJoinedClasses} />
            }
          >
            {joinedLoading
              ? [...Array(Math.max(1, displayedJoinedClasses.length))].map((_, i) => (
                <ClassCardSkeleton key={i} />
              ))
              : displayedJoinedClasses.map((item) => (
                <ClassCard key={item.id} item={item} />
              ))}
          </Section>
        </div>
      </div>

      <CreateClassModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          fetchClasses();
        }}
      />
    </div>
  );
}

function Section({
  title,
  viewAllHref,
  leadingCard,
  children,
}: {
  title: string;
  viewAllHref: string;
  leadingCard: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 text-sm font-medium"
        >
          View all <HiChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {leadingCard}
        {children}
      </div>
    </section>
  );
}
