"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { HiPlus, HiOutlineArrowRight, HiChevronRight } from "react-icons/hi";

import { Modal } from "@/components/ui/Modal";
import { getClasses, Class, joinClass } from "@/lib/api/class";
import "sweetalert2/dist/sweetalert2.min.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import ClassCard from "@/components/class/ClassCard"; // 1. Import ClassCard ที่แยกไว้

const MySwal = withReactContent(Swal);

export default function ClassPage() {
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      setError(null);
      const fetchedClasses = await getClasses();
      setClasses(fetchedClasses);
    } catch (err: any) {
      setError(err.message || "Failed to fetch classes.");
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to fetch classes.",
      });
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    setPageLoading(true);
    fetchClasses();
  }, [fetchClasses]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim();
    if (!code) return;

    setLoading(true);
    try {
      const res = await joinClass(code);
      setJoinOpen(false);
      setJoinCode("");

      await MySwal.fire({
        icon: "success",
        title: "Joined Successfully!",
        text: res.message,
        timer: 1500,
        showConfirmButton: false,
      });

      await fetchClasses();
    } catch (err: any) {
      MySwal.fire({
        icon: "error",
        title: "Join Failed",
        text: err.message || "Could not join the class. Please check the code.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-gray-500">Loading classes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  const myClasses = classes;
  const joinedClasses: Class[] = [];

  return (
    <div className=" min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-12">
          <Section
            title="My Classes"
            viewAllHref="/class/my"
            leadingCard={<CreateCard />}
          >
            {myClasses.map((item) => (
              <ClassCard key={item.id} item={item} />
            ))}
          </Section>

          <Section
            title="Joined Classes"
            viewAllHref="/class/join"
            leadingCard={<JoinPrivateCard onOpen={() => setJoinOpen(true)} />}
          >
            {joinedClasses.map((item) => (
              <ClassCard key={item.id} item={item} />
            ))}
          </Section>
        </div>
      </div>

      <Modal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="Join Private Class"
      >
        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            placeholder="Enter your class ID or code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="w-full h-12 rounded-lg border border-gray-300 px-4 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
            autoFocus
          />
          <button
            type="submit"
            disabled={!joinCode.trim() || loading}
            className="w-full h-12 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "Joining..." : "Join Class"}
          </button>
        </form>
      </Modal>
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
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
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

function CreateCard() {
  return (
    <Link
      href="/class/create"
      className="group h-full rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300"
    >
      <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 grid place-items-center mb-4 group-hover:scale-110 transition-transform">
        <HiPlus className="w-7 h-7" />
      </div>
      <p className="font-semibold text-gray-800">Create New Class</p>
      <p className="text-xs text-gray-500 mt-1">
        Start a new classroom for your assignments.
      </p>
    </Link>
  );
}

function JoinPrivateCard({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group h-full w-full rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6 flex flex-col items-center justify-center text-center hover:border-teal-500 hover:bg-teal-50 transition-all duration-300"
    >
      <div className="w-14 h-14 rounded-full bg-teal-100 text-teal-600 grid place-items-center mb-4 group-hover:scale-110 transition-transform">
        <HiOutlineArrowRight className="w-6 h-6" />
      </div>
      <p className="font-semibold text-gray-800">Join Private Class</p>
      <p className="text-xs text-gray-500 mt-1">
        Enter a class using an invite code.
      </p>
    </button>
  );
}
