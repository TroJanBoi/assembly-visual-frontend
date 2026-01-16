import { useEffect, useRef, useCallback } from 'react';
import { updateMyPlayground, getMyPlayground } from '@/lib/api/playground';

interface PlaygroundDBOptions {
    delay?: number;  // Debounce delay (default: 3000ms)
    enabled?: boolean;
    onSave?: (result: any) => void;
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
    const isSavingRef = useRef(false);

    // Immediate save function
    const saveImmediately = useCallback(async () => {
        if (!assignmentId || !data || isSavingRef.current) return;

        // Clear pending debounced save
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        const currentData = JSON.stringify(data);
        if (currentData === lastSavedRef.current) {
            console.log('[DB] No changes to save');
            return;
        }

        try {
            isSavingRef.current = true;
            console.log('[DB] Immediate save triggered');
            const result = await updateMyPlayground({
                assignment_id: assignmentId,
                item: data,
                status: 'in_progress',
            });
            lastSavedRef.current = currentData;
            if (options.onSave) options.onSave(result);
            console.log('[DB] ✓ Immediate save complete');
        } catch (e) {
            console.error('[DB] ✗ Immediate save failed:', e);
        } finally {
            isSavingRef.current = false;
        }
    }, [data, assignmentId]);

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
            if (isSavingRef.current) return;

            try {
                isSavingRef.current = true;
                console.log('[DB AutoSave] Saving...');
                const result = await updateMyPlayground({
                    assignment_id: assignmentId,
                    item: data,
                    status: 'in_progress',
                });
                lastSavedRef.current = currentData;
                if (options.onSave) options.onSave(result);
                console.log('[DB AutoSave] ✓ Saved');
            } catch (e) {
                console.error('[DB AutoSave] ✗ Failed:', e);
            } finally {
                isSavingRef.current = false;
            }
        }, delay);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [data, assignmentId, delay, enabled]);

    return { saveImmediately };
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

        if (playground) {
            console.log('[DB] ✓ Loaded playground from DB');
            return playground;
        }

        console.log('[DB] No playground found in DB');
        return null;
    } catch (e) {
        console.error('[DB] Failed to load playground:', e);
        return null;
    }
}
