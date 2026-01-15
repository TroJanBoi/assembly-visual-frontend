// hooks/usePlaygroundDB.ts
// Database persistence for playground with debounced save

import { useEffect, useRef } from 'react';
import { updateMyPlayground, getMyPlayground } from '@/lib/api/playground';

interface PlaygroundDBOptions {
    delay?: number;  // Debounce delay (default: 3000ms)
    enabled?: boolean;
}

/**
 * Auto-save to database with debounce
 */
export function usePlaygroundDBSave(
    data: any,
    assignmentId: number | undefined,
    options: PlaygroundDBOptions = {}
) {
    const { delay = 3000, enabled = true } = options;
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedRef = useRef<string>('');

    useEffect(() => {
        if (!enabled || !assignmentId || !data) return;

        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Check if data changed
        const currentData = JSON.stringify(data);
        if (currentData === lastSavedRef.current) return;

        // Debounced save
        timeoutRef.current = setTimeout(async () => {
            try {
                console.log('[DB AutoSave] Saving...');
                await updateMyPlayground({
                    assignment_id: assignmentId,
                    item: data,
                    status: 'in_progress',
                });
                lastSavedRef.current = currentData;
                console.log('[DB AutoSave] ✓ Saved');
            } catch (e) {
                console.error('[DB AutoSave] ✗ Failed:', e);
            }
        }, delay);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [data, assignmentId, delay, enabled]);
}

/**
 * Load playground from database on mount
 */
export async function loadPlaygroundFromDB(
    assignmentId: number
): Promise<any | null> {
    try {
        console.log('[DB] Loading playground for assignment', assignmentId);
        const playground = await getMyPlayground(assignmentId);

        if (playground && playground.item) {
            console.log('[DB] ✓ Loaded playground from DB');
            return playground.item;
        }

        console.log('[DB] No playground found in DB');
        return null;
    } catch (e) {
        console.error('[DB] Failed to load playground:', e);
        return null;
    }
}
