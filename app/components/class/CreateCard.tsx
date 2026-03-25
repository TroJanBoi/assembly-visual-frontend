import { HiPlus } from "react-icons/hi";

export default function CreateCard({ onOpen }: { onOpen: () => void }) {
    return (
        <button
            onClick={onOpen}
            className="group h-full w-full rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-all duration-300"
        >
            <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 grid place-items-center mb-4 group-hover:scale-110 transition-transform">
                <HiPlus className="w-7 h-7" />
            </div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">Create New Class</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Start a new classroom for your assignments.
            </p>
        </button>
    );
}
