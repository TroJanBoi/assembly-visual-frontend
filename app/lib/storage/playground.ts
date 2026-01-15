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
                version: '1.0',
            },
        };
        localStorage.setItem(key, JSON.stringify(payload));
        console.log(`[LocalStorage] Saved playground ${assignmentId} for user ${userId}`);
    } catch (e) {
        console.error('[LocalStorage] Save failed:', e);
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
        console.log(`[LocalStorage] Loaded playground ${assignmentId} for user ${userId}`);
        return data;
    } catch (e) {
        console.error('[LocalStorage] Load failed:', e);
        return null;
    }
}

/**
 * Clear playground state from LocalStorage
 */
export function clearLocalStorage(assignmentId: number, userId: number): void {
    try {
        const key = `playground_${assignmentId}_${userId}`;
        localStorage.removeItem(key);
        console.log(`[LocalStorage] Cleared playground ${assignmentId} for user ${userId}`);
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

        console.log('[LocalStorage] Migrated legacy storage');
        return migratedData;
    } catch (e) {
        console.error('[LocalStorage] Migration failed:', e);
        return null;
    }
}
