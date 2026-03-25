import { create } from 'zustand';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection, addEdge } from 'reactflow';
import { Variable } from '@/components/playground/VariableManager';

export type HistorySnapshot = {
    nodes: Node[];
    edges: Edge[];
    variables: Variable[];
};

interface EditorState {
    // --- Data ---
    nodes: Node[];
    edges: Edge[];
    variables: Variable[];

    // --- History (Undo/Redo) ---
    past: HistorySnapshot[];
    future: HistorySnapshot[];

    // --- Actions: Setters ---
    setNodes: (updater: Node[] | ((nds: Node[]) => Node[])) => void;
    setEdges: (updater: Edge[] | ((eds: Edge[]) => Edge[])) => void;
    setVariables: (updater: Variable[] | ((vars: Variable[]) => Variable[])) => void;

    // --- Actions: React Flow Built-ins ---
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection | Edge) => void;

    // --- Actions: History Management ---
    takeSnapshot: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;

    // --- Actions: Initialization ---
    loadFromSave: (nodes: Node[], edges: Edge[], variables: Variable[]) => void;
}

const MAX_HISTORY_STEPS = 50;

export const useEditorStore = create<EditorState>((set, get) => ({
    nodes: [],
    edges: [],
    variables: [],

    past: [],
    future: [],
    canUndo: false,
    canRedo: false,

    setNodes: (updater) => set((state) => {
        const newNodes = typeof updater === 'function' ? updater(state.nodes) : updater;
        return { nodes: newNodes };
    }),

    setEdges: (updater) => set((state) => {
        const newEdges = typeof updater === 'function' ? updater(state.edges) : updater;
        return { edges: newEdges };
    }),

    setVariables: (updater) => set((state) => {
        const newVars = typeof updater === 'function' ? updater(state.variables) : updater;
        return { variables: newVars };
    }),

    // ==========================================
    // React Flow Standard Handlers
    // ==========================================
    onNodesChange: (changes: NodeChange[]) => {
        set((state) => {
            // Small optimization: don't snapshot on every tiny 'position' drag frame, 
            // rely on 'onNodeDragStop' to take snapshots.
            // We will snapshot on specific changes (add/remove etc) if needed, 
            // but for pure movements, we let page.tsx or onNodeDragStop call takeSnapshot.
            return { nodes: applyNodeChanges(changes, state.nodes) };
        });
    },

    onEdgesChange: (changes: EdgeChange[]) => {
        set((state) => {
            // Usually edge removals might want a snapshot. 
            // To keep it simple, we let the UI call takeSnapshot() before removing edges,
            // or we can detect 'remove' changes here.
            const hasRemovals = changes.some(c => c.type === 'remove');
            if (hasRemovals && state.past.length === 0) {
                // Fallback snapshot if none taken recently (though UI should handle it)
            }
            return { edges: applyEdgeChanges(changes, state.edges) };
        });
    },

    onConnect: (connection: Connection | Edge) => {
        // Take snapshot BEFORE adding edge
        get().takeSnapshot();

        set((state) => ({
            edges: addEdge(
                { ...connection, type: 'default', animated: false, style: { stroke: '#94a3b8', strokeWidth: 2 } },
                state.edges
            ),
        }));
    },


    // ==========================================
    // History Management (Undo / Redo)
    // ==========================================
    takeSnapshot: () => {
        set((state) => {
            const currentSnapshot: HistorySnapshot = {
                nodes: JSON.parse(JSON.stringify(state.nodes)),
                edges: JSON.parse(JSON.stringify(state.edges)),
                variables: JSON.parse(JSON.stringify(state.variables)),
            };

            // Prevent duplicate identical snapshots
            if (state.past.length > 0) {
                const last = state.past[state.past.length - 1];
                if (
                    JSON.stringify(last.nodes) === JSON.stringify(currentSnapshot.nodes) &&
                    JSON.stringify(last.edges) === JSON.stringify(currentSnapshot.edges)
                ) {
                    return state; // No actual change
                }
            }

            const newPast = [...state.past, currentSnapshot].slice(-MAX_HISTORY_STEPS);

            return {
                past: newPast,
                future: [], // clear future on new action
                canUndo: true,
                canRedo: false,
            };
        });
    },

    undo: () => {
        set((state) => {
            if (state.past.length === 0) return state;

            const newPast = [...state.past];
            const previousState = newPast.pop()!;

            // Save current state to future
            const currentSnapshot: HistorySnapshot = {
                nodes: JSON.parse(JSON.stringify(state.nodes)),
                edges: JSON.parse(JSON.stringify(state.edges)),
                variables: JSON.parse(JSON.stringify(state.variables)),
            };

            return {
                past: newPast,
                future: [currentSnapshot, ...state.future],
                nodes: previousState.nodes,
                edges: previousState.edges,
                variables: previousState.variables,
                canUndo: newPast.length > 0,
                canRedo: true,
            };
        });
    },

    redo: () => {
        set((state) => {
            if (state.future.length === 0) return state;

            const newFuture = [...state.future];
            const nextState = newFuture.shift()!;

            // Save current state to past
            const currentSnapshot: HistorySnapshot = {
                nodes: JSON.parse(JSON.stringify(state.nodes)),
                edges: JSON.parse(JSON.stringify(state.edges)),
                variables: JSON.parse(JSON.stringify(state.variables)),
            };

            return {
                past: [...state.past, currentSnapshot],
                future: newFuture,
                nodes: nextState.nodes,
                edges: nextState.edges,
                variables: nextState.variables,
                canUndo: true,
                canRedo: newFuture.length > 0,
            };
        });
    },

    loadFromSave: (nodes, edges, variables) => {
        set({
            nodes,
            edges,
            variables,
            past: [],
            future: [],
            canUndo: false,
            canRedo: false
        });
    }

}));
