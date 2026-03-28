"use client";
export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClass } from "@/lib/api/class";
import { getToken, decodeToken } from "@/lib/auth/token";
import { toast } from "sonner";
import { CLASS_BANNERS } from "@/lib/constants/banners";
import BannerSelectionModal from "@/components/class/BannerSelectionModal";
import { Plus } from "lucide-react";

type Privacy = "public" | "private";

export default function CreateClassPage() {
  const router = useRouter();
  const [privacy, setPrivacy] = useState<Privacy>("public");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  // Default to first banner (or 0) if desired, or null to force selection
  const [bannerId, setBannerId] = useState<number>(0);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedBanner = useMemo(() => {
    return CLASS_BANNERS.find((b) => b.id === bannerId);
  }, [bannerId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.warning("Please enter a class name.");
    }

    try {
      setSubmitting(true);

      const classData = {
        topic: name.trim(),
        description: desc.trim(),
        status: privacy === "public" ? 0 : 1,
        banner_id: bannerId,
      };
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
        {/* Banner Selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">Class Banner</label>
          <div
            onClick={() => setShowBannerModal(true)}
            className="group relative w-full h-40 sm:h-56 lg:h-64 rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-indigo-600 transition-all ring-offset-2 hover:shadow-lg"
          >
            {selectedBanner ? (
              <div
                className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                style={{ 
                  backgroundColor: selectedBanner.color,
                  backgroundImage: `url(${selectedBanner.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 dark:bg-slate-800 flex flex-col items-center justify-center text-gray-400">
                <div className="p-4 rounded-full bg-white dark:bg-slate-700 shadow-sm mb-2">
                  <Plus size={24} />
                </div>
                <span className="font-medium">Select a banner</span>
              </div>
            )}

            {/* Overlay hint */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="bg-white/90 dark:bg-slate-900/90 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-lg">
                Change Banner
              </div>
            </div>

            {/* Selected Name Badge */}
            {selectedBanner && (
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm text-gray-700 dark:text-gray-200 pointer-events-none">
                {selectedBanner.name}
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Choose a visual theme for your class from our gallery.
          </p>
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
      </form>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-end gap-6">
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

      <BannerSelectionModal
        open={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        onSelect={setBannerId}
        selectedId={bannerId}
      />
    </div>
  );
}
