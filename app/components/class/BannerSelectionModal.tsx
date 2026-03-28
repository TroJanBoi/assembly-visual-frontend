import { CLASS_BANNERS } from "@/lib/constants/banners";
import { X } from "lucide-react";

interface BannerSelectionModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (id: number) => void;
    selectedId: number | undefined;
}

export default function BannerSelectionModal({
    open,
    onClose,
    onSelect,
    selectedId,
}: BannerSelectionModalProps) {
    if (!open) return null;

    return (
        <div className="relative z-50">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto pointer-events-none ">
                <div className="flex min-h-full items-center justify-center p-4">
                    {/* Modal Panel */}
                    <div className="pointer-events-auto w-full max-w-4xl rounded-xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-gray-100 dark:border-slate-800 ">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Select Class Banner
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                type="button"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2 pb-6 ">
                            {CLASS_BANNERS.map((banner) => (
                                <button
                                    key={banner.id}
                                    onClick={() => {
                                        onSelect(banner.id);
                                        onClose();
                                    }}
                                    className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 text-left hover:scale-[1.02]
                    ${selectedId === banner.id
                                            ? "border-indigo-600 ring-2 ring-indigo-600/20"
                                            : "border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                                        }
                  `}
                                    type="button"
                                >
                                    <div
                                        className="h-32 w-full"
                                        style={{
                                            backgroundImage: `url(${banner.imageUrl})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    />
                                    <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/50">
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                            {banner.name}
                                        </p>
                                    </div>

                                    {/* Selected Indicator */}
                                    {selectedId === banner.id && (
                                        <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full shadow-lg">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                className="w-4 h-4"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
