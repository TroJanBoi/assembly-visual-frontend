"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { updateClass, UpdateClassInput } from "@/lib/api/class";
import { useClass } from "../ClassContext";
import { toast } from "sonner";
import { CLASS_BANNERS } from "@/lib/constants/banners";
import BannerSelectionModal from "@/components/class/BannerSelectionModal";
import { Plus } from "lucide-react";

type Privacy = "public" | "private";

export default function EditClassPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { classData, isOwner: contextIsOwner, loading: contextLoading } = useClass();

    const [privacy, setPrivacy] = useState<Privacy>("public");
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Banner state
    const [bannerId, setBannerId] = useState<number>(0);
    const [showBannerModal, setShowBannerModal] = useState(false);

    const selectedBanner = useMemo(() => {
        return CLASS_BANNERS.find((b) => b.id === bannerId);
    }, [bannerId]);

    useEffect(() => {
        if (contextLoading) return;

        if (classData) {
            setName(classData.topic);
            setDesc(classData.description);
            setPrivacy(classData.status === 0 ? "public" : "private");
            setBannerId(classData.banner_id || 0);
            setLoading(false);
        } else if (!contextLoading && !classData) {
            // Handle case where class data fails to load (though context handles error usually)
            // Or maybe user navigated here directly and context failed?
            // But valid id should yield data or error.
            setLoading(false);
        }
    }, [id, router, contextLoading, classData]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            return toast.warning("Please enter a class name.");
        }

        try {
            setSubmitting(true);

            const updateData: UpdateClassInput = {
                topic: name.trim(),
                description: desc.trim(),
                status: privacy === "public" ? 0 : 1,
                banner_id: bannerId,
            };

            await updateClass(id, updateData);

            toast.success("Class Updated!", {
                description: "The class details have been updated successfully.",
                duration: 1500,
            });

            router.push(`/class/${id}`);
        } catch (err: any) {
            toast.error("Update Failed", {
                description: err?.message || "Something went wrong.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-gray-500">Loading class details...</p>
            </div>
        );
    }

    return (
        <div className="p-6 lg:py-10 lg::px-12 space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">

                <div>
                    <h1 className="text-2xl lg:text-3xl font-extrabold">Edit class</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Update your classroom information and settings.
                    </p>
                </div>

                <div className="ml-auto text-sm">
                    <div className="text-gray-500 mb-2 text-right">
                        Class privacy
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
                                style={selectedBanner.style}
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
                        href={`/class/${id}`}
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
                        {submitting ? "Saving..." : "Save changes"}
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
