import { useState, useEffect, useCallback } from 'react';
import { Node, Edge } from 'reactflow';

const STORAGE_KEY = 'cpu-sim-playground-v1';

export function useAutoSave(
  nodes: Node[],
  edges: Edge[],
  memory: Record<string, number>,
  onLoad: (nodes: Node[], edges: Edge[], memory: Record<string, number>) => void,
  storageKey: string = 'cpu-sim-playground-v1'
) {
  const [loaded, setLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { nodes: savedNodes, edges: savedEdges, memory: savedMemory } = JSON.parse(saved);
        if (Array.isArray(savedNodes) && Array.isArray(savedEdges)) {
          // Restore memory if exists, else empty object
          onLoad(savedNodes, savedEdges, savedMemory || {});
        }
      } catch (e) {
        console.error("Failed to parse playground auto-save:", e);
      }
    }
    setLoaded(true);
  }, []); // Empty dependency array -> Run once on mount

  // Save on change (debounced)
  useEffect(() => {
    if (!loaded) return; // Don't save before loading is attempted

    const timer = setTimeout(() => {
      // Only save if we have some nodes (prevent saving empty state over good state on initial render glitch)
      // Actually, saving empty state is valid if user cleared everything. 
      // But we should be careful about the initial empty state before load.
      // 'loaded' flag protects us from saving the initial [] before we tried to load.

      const data = JSON.stringify({ nodes, edges, memory });
      localStorage.setItem(STORAGE_KEY, data);
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [nodes, edges, memory, loaded]);

  const resetSave = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload(); // Simple reload to reset state as requested
  }, []);

  return { loaded, resetSave };
}
