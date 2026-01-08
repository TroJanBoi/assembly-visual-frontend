import React, { useState } from "react";
import { HiPlus, HiPencil, HiTrash, HiCheck, HiX } from "react-icons/hi";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

export interface Variable {
    id: string;
    name: string;
    value: number;
    address: number;
}

interface VariableManagerProps {
    variables: Variable[];
    onAdd: (name: string, value: number) => void;
    onEdit: (id: string, name: string, value: number) => void;
    onDelete: (id: string) => void;
}

export default function VariableManager({
    variables,
    onAdd,
    onEdit,
    onDelete,
}: VariableManagerProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [newValue, setNewValue] = useState("0");

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editValue, setEditValue] = useState("");

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseInt(newValue, 10);
        if (!newName || isNaN(val)) return;
        onAdd(newName, val);
        setIsAdding(false);
        setNewName("");
        setNewValue("0");
    };

    const startEdit = (v: Variable) => {
        setEditingId(v.id);
        setEditName(v.name);
        setEditValue(v.value.toString());
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName("");
        setEditValue("");
    };

    const submitEdit = () => {
        if (!editingId) return;
        const val = parseInt(editValue, 10);
        if (!editName || isNaN(val)) return;
        onEdit(editingId, editName, val);
        setEditingId(null);
    };

    return (
        <section className="my-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-semibold text-gray-700">Variables</h3>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="p-1 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                        title="Add Variable"
                    >
                        <HiPlus className="w-4 h-4" />
                    </button>
                )}
            </div>

            {isAdding && (
                <form
                    onSubmit={handleAddSubmit}
                    className="bg-gray-50 border border-indigo-100 rounded-lg p-2 mb-2 space-y-2"
                >
                    <div>
                        <label className="text-xs text-gray-500 font-semibold uppercase">
                            Name
                        </label>
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. count"
                            className="h-7 text-sm"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-semibold uppercase">
                            Value
                        </label>
                        <Input
                            type="number"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            className="h-7 text-sm"
                        />
                    </div>
                    <div className="flex justify-end gap-1 mt-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Add
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1">
                {variables.length === 0 && !isAdding && (
                    <p className="text-sm text-gray-400 italic text-center py-2">No variables</p>
                )}
                {variables.map((v) => (
                    <div
                        key={v.id}
                        className="group flex items-center justify-between p-2 rounded hover:bg-white/60 hover:shadow-sm border border-transparent transition-all text-sm"
                    >
                        {editingId === v.id ? (
                            <div className="flex-1 flex gap-1 items-center">
                                <input
                                    className="w-full border rounded px-2 py-1  "
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                                <input
                                    className="w-full h-full border rounded px-2 py-1 "
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                />
                                <button onClick={submitEdit} className="text-green-600 hover:text-green-700">
                                    <HiCheck size={22} />
                                </button>
                                <button onClick={cancelEdit} className="text-red-500 hover:text-red-600">
                                    <HiX size={22} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-800">{v.name}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">#{v.address} (0x{v.address.toString(16).toUpperCase()})</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-gray-700 font-semibold bg-white/50 px-1.5 rounded">{v.value}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(v)}
                                            className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-white"
                                            title="Edit"
                                        >
                                            <HiPencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(v.id)}
                                            className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-white"
                                            title="Delete"
                                        >
                                            <HiTrash className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
