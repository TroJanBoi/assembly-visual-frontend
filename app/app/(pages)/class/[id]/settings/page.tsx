"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { updateClass, deleteClass, UpdateClassInput } from "@/lib/api/class";
import { toast } from "sonner";
import { useClass } from "../ClassContext";
import { CLASS_BANNERS } from "@/lib/constants/banners";
import BannerSelectionModal from "@/components/class/BannerSelectionModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { HiOutlineCog, HiOutlineExclamationCircle } from "react-icons/hi";
import ClassToolHeader from "@/components/class/ClassToolHeader";
import { cn } from "@/lib/utils";

type Privacy = "public" | "private";

export default function ClassSettingsPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { classData, isOwner: contextIsOwner, loading: contextLoading } = useClass();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [showBannerModal, setShowBannerModal] = useState(false);

    // Form state
    const [privacy, setPrivacy] = useState<Privacy>("public");
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [bannerId, setBannerId] = useState<number>(0);

    const selectedBanner = useMemo(() => CLASS_BANNERS.find((b) => b.id === bannerId), [bannerId]);

    useEffect(() => {
        if (contextLoading) return;
        if (!contextIsOwner) {
            toast.error("Access denied");
            router.push(`/class/${id}`);
            return;
        }

        if (classData) {
            setName(classData.topic);
            setDesc(classData.description || "");
            setPrivacy(classData.status === 0 ? "public" : "private");
            setBannerId(classData.banner_id || 0);
            setLoading(false);
        }
    }, [id, router, contextLoading, contextIsOwner, classData]);

    const onSave = async () => {
        if (!name.trim()) return toast.warning("Class name is required.");
        try {
            setSubmitting(true);
            const payload: UpdateClassInput = {
                topic: name.trim(),
                description: desc.trim(),
                status: privacy === "public" ? 0 : 1,
                banner_id: bannerId,
            };
            await updateClass(id, payload);
            toast.success("Class updated successfully!");
        } catch (e: any) {
            toast.error(e?.message || "Failed to update class");
        } finally {
            setSubmitting(false);
        }
    };

    const onDelete = async () => {
        try {
            setDeleting(true);
            await deleteClass(id);
            toast.success("Class deleted");
            router.push("/class/my");
        } catch (e: any) {
            toast.error(e?.message || "Failed to delete class");
        } finally {
            setDeleting(false);
            setIsDeleteOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <ClassToolHeader
                title="Class Settings"
                subtitle="Edit class details and manage your classroom"
            />

            <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-8">

                {/* General Settings */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-800">General</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Banner */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Class Banner</label>
                            <div
                                onClick={() => setShowBannerModal(true)}
                                className="group relative w-full h-36 rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-indigo-500 transition-all"
                            >
                                {selectedBanner ? (
                                    <div className="w-full h-full" style={{
                                        backgroundImage: `url(${selectedBanner.imageUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }} />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                                        <Plus className="w-6 h-6 mb-1" />
                                        <span className="text-sm">Select a banner</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                                    <span className="bg-white/90 text-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                                        Change Banner
                                    </span>
                                </div>
                                {selectedBanner && (
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-md text-xs font-semibold text-gray-700 shadow-sm pointer-events-none">
                                        {selectedBanner.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Class name */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Class Name <span className="text-red-500">*</span></label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your class name"
                                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</label>
                            <textarea
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                rows={4}
                                placeholder="Describe your class..."
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                            />
                        </div>

                        {/* Privacy */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Visibility</label>
                            <div className="flex gap-3">
                                {(["public", "private"] as Privacy[]).map((p) => (
                                    <label
                                        key={p}
                                        className={cn(
                                            "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium capitalize",
                                            privacy === p
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="privacy"
                                            value={p}
                                            checked={privacy === p}
                                            onChange={() => setPrivacy(p)}
                                            className="hidden"
                                        />
                                        <div className={cn("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center", privacy === p ? "border-indigo-500" : "border-gray-300")}>
                                            {privacy === p && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                        </div>
                                        {p}
                                    </label>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">
                                {privacy === "public" ? "Anyone can find and view this class." : "Only invited or joined members can access."}
                            </p>
                        </div>

                        {/* Save button */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={onSave}
                                disabled={submitting}
                                className="flex items-center gap-2 h-10 px-5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-md shadow-indigo-500/20"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {submitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-2xl border-2 border-red-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-red-100 bg-red-50">
                        <h2 className="font-semibold text-red-700 flex items-center gap-2">
                            <HiOutlineExclamationCircle className="w-5 h-5" />
                            Danger Zone
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="font-medium text-gray-800 text-sm">Delete this class</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Permanently removes all assignments, submissions, and member data. This cannot be undone.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsDeleteOpen(true)}
                                className="flex items-center gap-2 h-9 px-4 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all flex-shrink-0 shadow-md shadow-red-500/20"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Class
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <BannerSelectionModal
                open={showBannerModal}
                onClose={() => setShowBannerModal(false)}
                onSelect={setBannerId}
                selectedId={bannerId}
            />
            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={onDelete}
                title="Delete Class"
                description="Are you sure you want to permanently delete this class? All assignments, submissions, and member data will be lost forever."
                confirmLabel="Delete Permanently"
                variant="destructive"
                loading={deleting}
            />
        </div>
    );
}
