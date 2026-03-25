import { useCallback, useRef } from 'react';
import { Node, Edge, ReactFlowInstance } from 'reactflow';
import { toast } from "sonner";

interface UsePlaygroundHotkeysProps {
    reactFlowInstance: ReactFlowInstance | null;
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    takeSnapshot: () => void;
    getId: () => string;
}

export function usePlaygroundHotkeys({
    reactFlowInstance,
    setNodes,
    setEdges,
    canUndo,
    canRedo,
    undo,
    redo,
    takeSnapshot,
    getId
}: UsePlaygroundHotkeysProps) {
    // Used for copy/paste
    const copiedElements = useRef<{ nodes: Node[], edges: Edge[] }>({ nodes: [], edges: [] });

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        // Prevent triggering if typing in an input
        if (
            document.activeElement instanceof HTMLInputElement ||
            document.activeElement instanceof HTMLTextAreaElement
        ) {
            return;
        }

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

        if (isCmdOrCtrl && e.key.toLowerCase() === "z") {
            if (e.shiftKey) {
                if (canRedo) redo();
            } else {
                if (canUndo) undo();
            }
            e.preventDefault();
            return;
        }

        if (isCmdOrCtrl && e.key.toLowerCase() === "y") {
            if (canRedo) redo();
            e.preventDefault();
            return;
        }

        if (isCmdOrCtrl && e.key.toLowerCase() === "c") {
            if (!reactFlowInstance) return;

            e.preventDefault();

            const selectedNodes = reactFlowInstance.getNodes().filter((n) => n.selected);
            const selectedEdges = reactFlowInstance.getEdges().filter(
                (edge) =>
                    edge.selected ||
                    (selectedNodes.some((n) => n.id === edge.source) &&
                        selectedNodes.some((n) => n.id === edge.target))
            );
            copiedElements.current = { nodes: selectedNodes, edges: selectedEdges };

            if (selectedNodes.length > 0) {
                toast.success(`Copied ${selectedNodes.length} nodes`);
            }
        } else if (isCmdOrCtrl && e.key.toLowerCase() === "v") {
            if (copiedElements.current.nodes.length === 0) return;

            e.preventDefault();
            takeSnapshot();

            const idMap = new Map<string, string>();
            const newNodes = copiedElements.current.nodes.map((n) => {
                const newId = getId();
                idMap.set(n.id, newId);
                // Offset so it doesn't overlap perfectly
                return {
                    ...n,
                    id: newId,
                    selected: true,
                    position: { x: n.position.x + 40, y: n.position.y + 40 }
                };
            });

            const newEdges = copiedElements.current.edges.map(e => {
                return {
                    ...e,
                    id: `e${idMap.get(e.source) || e.source}-${idMap.get(e.target) || e.target}`,
                    source: idMap.get(e.source) || e.source,
                    target: idMap.get(e.target) || e.target,
                    selected: true,
                };
            }).filter(e => idMap.has(e.source) && idMap.has(e.target));

            setNodes((nds: Node[]) => [
                ...nds.map(n => ({ ...n, selected: false })),
                ...newNodes
            ]);
            setEdges((eds: Edge[]) => [
                ...eds.map(e => ({ ...e, selected: false })),
                ...newEdges
            ]);

            toast.success(`Pasted ${newNodes.length} nodes`);
        } else if (e.key === "Delete" || e.key === "Backspace") {
            // Automatic delete handled by React Flow, but we can snapshot here if we want manual control.
            takeSnapshot();
        }
    }, [reactFlowInstance, setNodes, setEdges, canUndo, canRedo, undo, redo, takeSnapshot, getId]);

    return { handleKeyDown };
}
