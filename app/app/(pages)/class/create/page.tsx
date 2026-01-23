// app/class/create/page.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClass } from "@/lib/api/class";
import { AssignmentFormData } from "@/types/assignment";
import { decodeToken, getToken } from "@/lib/auth/token";

// import Swal from "sweetalert2";
// import withReactContent from "sweetalert2-react-content";
// import "sweetalert2/dist/sweetalert2.min.css";
import { toast } from "sonner";

// const MySwal = withReactContent(Swal);

type Privacy = "public" | "private";

export default function CreateClassPage() {
  const router = useRouter();
  const [privacy, setPrivacy] = useState<Privacy>("public");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [syncGC, setSyncGC] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [banner, setBanner] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const previewUrl = useMemo(() => {
    if (!banner) return "";
    return URL.createObjectURL(banner);
  }, [banner]);

  const onPick = () => inputRef.current?.click();

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSet(file);
  };

  const validateAndSet = (file: File) => {
    const okType = /image\/(png|jpeg)/.test(file.type);
    const okSize = file.size <= 4 * 1024 * 1024; // 4MB
    if (!okType)
      return toast.warning("Only JPG or PNG is supported.");
    if (!okSize)
      return toast.warning("Max file size is 4MB.");
    setBanner(file);
  };

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (f) validateAndSet(f);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.warning("Please enter a class name.");
    }

    try {
      setSubmitting(true);

      const token = getToken();
      const decoded = token ? decodeToken(token) : null;
      const userId = decoded?.user_id;

      const classData = {
        owner: userId,
        topic: name.trim(),
        description: desc.trim(),
        status: privacy === "public" ? 0 : 1,
        google_course_id:
          syncGC && inviteCode.trim() ? inviteCode.trim() : undefined,
        google_course_link:
          syncGC && inviteCode.trim()
            ? `https://classroom.google.com/c/${inviteCode.trim()}`
            : undefined,
      };

      console.log(classData);

      const res = await createClass(classData);

      toast.success("Class Created!", {
        description: res.message || "The new class has been created successfully.",
        duration: 1500,
      });

      router.push("/class");
    } catch (err: any) {
      toast.error("Creation Failed", {
        description: err?.message || "Something went wrong.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:py-10 lg::px-12 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold">Create class</h1>
          <p className="mt-1 text-sm text-gray-500">
            The classroom is a room for adding assignments.
          </p>
        </div>

        {/* Privacy selector */}
        <div className="text-sm">
          <div className="text-gray-500 mb-2 text-right">
            Selected class privacy
          </div>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="privacy"
                value="public"
                checked={privacy === "public"}
                onChange={() => setPrivacy("public")}
                className="accent-indigo-600"
              />
              <span className="font-medium">Public</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="privacy"
                value="private"
                checked={privacy === "private"}
                onChange={() => setPrivacy("private")}
                className="accent-indigo-600"
              />
              <span className="font-medium">Private</span>
            </label>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="mt-6 space-y-6 pb-28">
        {/* Banner uploader – ทั้งกรอบคลิกได้ */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="relative rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700
                    bg-white dark:bg-slate-900 p-8 cursor-pointer focus-within:ring-2
                    focus-within:ring-[color:rgba(104,127,229,0.35)]"
        >
          {/* input ทับทั้งกรอบ */}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={onFileChange}
            aria-label="Upload class banner"
            className="absolute inset-0 z-10 opacity-0 cursor-pointer"
          />

          {previewUrl ? (
            <div className="relative w-full h-40 sm:h-56 lg:h-64 rounded-xl overflow-hidden ring-1 ring-gray-200 pointer-events-none">
              <Image
                src={previewUrl}
                alt="Banner preview"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          ) : (
            <div className="text-center text-gray-500 pointer-events-none">
              <div className="mx-auto w-14 h-14 rounded-xl grid place-items-center text-indigo-600 bg-indigo-50 mb-3">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="1.8"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div className="font-medium">
                Upload your banner class,{" "}
                <span className="text-indigo-600 underline underline-offset-4">
                  Browse
                </span>
              </div>
              <p className="text-xs mt-1">
                Image files must be a maximum of 4MB in size.
              </p>
              <div className="mt-3 text-xs text-gray-400 flex items-center justify-center gap-6">
                <span>*Supported jpg, png</span>
                <span>*Recommended size 1200×400</span>
              </div>
            </div>
          )}
        </div>

        {/* Class name */}
        <div>
          <label htmlFor="name" className="text-sm font-medium">
            Class name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your class name"
            required
            className="mt-1 h-11 w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 text-sm
                       outline-none focus:border-indigo-600 focus:ring-4
                       focus:ring-[color:rgba(104,127,229,0.18)]"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="desc" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="desc"
            rows={7}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Enter your description..."
            className="mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm
                       outline-none focus:border-indigo-600 focus:ring-4
                       focus:ring-[color:rgba(104,127,229,0.18)]"
          />
        </div>

        {/* Google Classroom sync */}
        <div className="space-y-2">
          <label className="inline-flex items-start gap-3 select-none">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded accent-indigo-600"
              checked={syncGC}
              onChange={(e) => setSyncGC(e.target.checked)}
            />
            <div>
              <div className="font-medium">Sync with Google Classroom</div>
              <p className="text-xs text-gray-500">
                You can connect Google Classroom with Blylab Classroom to add
                assignments and submit grades to Google Classroom.
              </p>
            </div>
          </label>

          <input
            disabled={!syncGC}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter your class invitation code"
            className="mt-2 h-11 w-full rounded-lg border border-gray-200 dark:border-slate-700 px-3 text-sm
                       disabled:opacity-60 disabled:cursor-not-allowed
                       outline-none focus:border-indigo-600 focus:ring-4
                       focus:ring-[color:rgba(104,127,229,0.18)]"
          />
        </div>
      </form>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <Link
            href="/class"
            className="h-10 px-4 rounded-lg border inline-flex items-center justify-center text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Cancel
          </Link>
          <button
            formAction=""
            onClick={onSubmit as any}
            disabled={submitting}
            className="h-10 px-5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create class"}
          </button>
        </div>
      </div>
    </div>
  );
}
