// lib/storage/playground.ts
// Unified LocalStorage management for Playground state

export interface PlaygroundLocalData {
    react_flow?: {
        nodes: any[];
        edges: any[];
        viewport: { x: number; y: number; zoom: number };
    };
    cpu_state?: {
        registers: Record<string, number>;
        memory: { address: number; value: number }[];
        variables: any[];
    };
    items?: any[];
    meta?: {
        last_saved: string;
        version: string;
    };
}

const CURRENT_VERSION = '1.1'; // Bumped to invalidate empty memory bug (v1.0)

/**
 * Save playground state to LocalStorage (real-time)
 */
export function saveToLocalStorage(
    assignmentId: number,
    userId: number,
    data: PlaygroundLocalData
): void {
    try {
        const key = `playground_${assignmentId}_${userId}`;
        const payload = {
            ...data,
            meta: {
                ...data.meta,
                last_saved: new Date().toISOString(),
                version: CURRENT_VERSION,
            },
        };
        localStorage.setItem(key, JSON.stringify(payload));
    } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
            console.error('[LocalStorage] Quota exceeded! Storage is full. Consider clearing old data.');
        } else {
            console.error('[LocalStorage] Save failed:', e);
        }
        // Re-throw to let caller know save failed
        throw e;
    }
}

/**
 * Load playground state from LocalStorage
 */
export function loadFromLocalStorage(
    assignmentId: number,
    userId: number
): PlaygroundLocalData | null {
    try {
        const key = `playground_${assignmentId}_${userId}`;
        const str = localStorage.getItem(key);
        if (!str) return null;

        const data = JSON.parse(str) as PlaygroundLocalData;

        // Version Check: Invalidate if version mismatch (forces clean start)
        if (data.meta?.version !== CURRENT_VERSION) {
            return null;
        }

        // Schema Validation: Ensure required fields exist
        if (!data.react_flow && !data.cpu_state) {
            console.warn('[LocalStorage] Invalid schema - missing required fields (react_flow or cpu_state)');
            return null;
        }
        return data;
    } catch (e) {
        console.error('[LocalStorage] Load failed:', e);
        return null; // Safe fallback
    }
}

/**
 * Clear playground state from LocalStorage
 */
export function clearLocalStorage(assignmentId: number, userId: number): void {
    try {
        const key = `playground_${assignmentId}_${userId}`;
        localStorage.removeItem(key);
    } catch (e) {
        console.error('[LocalStorage] Clear failed:', e);
    }
}

/**
 * Migrate legacy localStorage keys to new structure
 */
export function migrateLegacyStorage(
    assignmentId: number,
    userId: number
): PlaygroundLocalData | null {
    try {
        const varsStr = localStorage.getItem('asm_variables');
        const memStr = localStorage.getItem('asm_memory');

        if (!varsStr && !memStr) return null;

        const variables = varsStr ? JSON.parse(varsStr) : [];
        const memory = memStr ? JSON.parse(memStr) : [];

        const migratedData: PlaygroundLocalData = {
            cpu_state: {
                registers: { R0: 0, R1: 0, R2: 0, R3: 0 },
                memory,
                variables,
            },
            meta: {
                last_saved: new Date().toISOString(),
                version: '1.0',
            },
        };

        // Save to new structure
        saveToLocalStorage(assignmentId, userId, migratedData);

        // Clear old keys
        localStorage.removeItem('asm_variables');
        localStorage.removeItem('asm_memory');
        return migratedData;
    } catch (e) {
        console.error('[LocalStorage] Migration failed:', e);
        return null;
    }
}
