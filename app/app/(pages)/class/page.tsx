"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HiOutlineUserGroup,
  HiOutlineHeart,
  HiHeart,
  HiPlus,
  HiOutlineArrowRight,
  HiChevronRight,
} from "react-icons/hi";

import { Modal } from "@/components/ui/Modal";
import { getClasses, Class } from "@/lib/api/class";
import "sweetalert2/dist/sweetalert2.min.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function ClassPage() {
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setPageLoading(true);
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
    };
    fetchClasses();
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      setLoading(true);
      // TODO: call your API here, e.g. await joinClass({ code: joinCode.trim() })
      alert(`Joined with code: ${joinCode.trim()}`);
      setJoinOpen(false);
      setJoinCode("");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="p-6 text-center">Loading classes...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  // Note: The distinction between "My class" and "Join class" might need logic based on the owner field.
  // For now, I'll list all classes under "My class" for simplicity.
  const myClasses = classes;
  const joinedClasses: Class[] = []; // Placeholder for classes joined by the user

  return (
    <div className="p-6 space-y-12">
      {/* My class */}
      <Section
        title="My class"
        viewAllHref="/class/my"
        leadingCard={<CreateCard />}
      >
        {myClasses.map((item) => (
          <ClassCard key={item.id} item={item} />
        ))}
      </Section>

      {/* Join class */}
      <Section
        title="Join class"
        viewAllHref="/class/join"
        leadingCard={<JoinPrivateCard onOpen={() => setJoinOpen(true)} />}
      >
        {joinedClasses.map((item) => (
          <ClassCard key={item.id} item={item} />
        ))}
      </Section>

      {/* MODAL: Join private class */}
      <Modal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="Join private class"
      >
        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            placeholder="Enter your class code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="w-full h-12 rounded-lg border border-gray-200 dark:border-slate-700 px-4 text-base
                      outline-none focus:border-[var(--color-primary)] focus:ring-4
                      focus:ring-[color:rgba(104,127,229,0.18)]"
            autoFocus
          />
          <button
            type="submit"
            disabled={!joinCode.trim() || loading}
            className="w-full h-12 rounded-lg bg-[var(--color-primary)] text-white text-base font-medium
                      hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "Joining..." : "Join class"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

/* ---------- Section wrapper ---------- */
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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <Link
          href={viewAllHref}
          className="text-[var(--color-primary)] inline-flex items-center gap-1 text-sm hover:underline"
        >
          View all <HiChevronRight />
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* leading special card */}
        {leadingCard}
        {children}
      </div>
    </section>
  );
}

/* ---------- Create/Join special cards ---------- */
function CreateCard() {
  return (
    <Link
      href="/class/create"
      className="h-full rounded-2xl border border-gray-200 dark:border-slate-700
                 bg-white dark:bg-slate-900 p-6 grid place-items-center text-center
                 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
    >
      <div className="flex flex-col items-center gap-3 text-gray-600">
        <span className="grid place-items-center w-12 h-12 rounded-xl border border-gray-200">
          <HiPlus className="text-2xl" />
        </span>
        <div className="font-semibold">Create new class</div>
        <p className="text-xs text-gray-500">
          You can create a classroom of you
        </p>
      </div>
    </Link>
  );
}

function JoinPrivateCard({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="h-full w-full rounded-2xl border border-gray-200 dark:border-slate-700
                 bg-white dark:bg-slate-900 p-6 grid place-items-center text-center
                 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
    >
      <div className="flex flex-col items-center gap-3 text-gray-600">
        <span className="grid place-items-center w-12 h-12 rounded-xl border border-gray-200">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
        <div className="font-semibold">Join Private Class</div>
        <p className="text-xs text-gray-500">Enter by invite or code</p>
      </div>
    </button>
  );
}

/* ---------- Normal class card ---------- */
function ClassCard({ item }: { item: Class }) {
  const [liked, setLiked] = useState(Boolean(item.fav_score > 0));

  return (
    <article className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
      {/* cover */}
      <div className="relative h-40 w-full">
        <Image
          src={"/images/p1.png"} // Using a placeholder image
          alt={item.topic}
          fill
          className="object-cover"
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
        />
      </div>

      {/* content */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold line-clamp-1">{item.topic}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {item.description}
        </p>

        {/* meta + like */}
        <div className="flex items-center justify-between pt-2">
          <div className="inline-flex items-center gap-2 text-xs text-gray-500">
            <HiOutlineUserGroup />
            N/A
          </div>

          <button
            aria-label={liked ? "Unlike" : "Like"}
            onClick={() => setLiked((v) => !v)}
            className="text-[var(--color-primary)] p-1 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            {liked ? <HiHeart /> : <HiOutlineHeart />}
          </button>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <Link
          href={`/class/${item.id}`}
          className="w-full inline-flex justify-center items-center rounded-lg bg-[var(--color-primary)] text-white text-sm h-10 hover:opacity-90"
        >
          View
        </Link>
      </div>
    </article>
  );
}
