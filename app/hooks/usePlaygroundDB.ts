import { useEffect, useRef, useCallback } from 'react';
import { createPlayground, updatePlayground, getMyPlayground } from '@/lib/api/playground';

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
        if (!enabled || !assignmentId || !data || isSavingRef.current) return;

        // Clear pending debounced save
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        const currentData = JSON.stringify(data);
        if (currentData === lastSavedRef.current) {
            return;
        }

        try {
            isSavingRef.current = true;
            // Check if playground exists
            const payload = {
                assignment_id: assignmentId,
                item: data,
                status: 'in_progress',
            };

            try {
                // Try to get existing playground
                const existing = await getMyPlayground(assignmentId);
                if (existing) {
                    // Update existing
                    const result = await updatePlayground(payload);
                    lastSavedRef.current = currentData;
                    if (options.onSave) options.onSave(result);
                } else {
                    // Create new
                    const result = await createPlayground(payload);
                    lastSavedRef.current = currentData;
                    if (options.onSave) options.onSave(result);
                }
            } catch (fetchErr: any) {
                // If 404, create new playground
                if (fetchErr.message?.includes('404') || fetchErr.message?.includes('not found')) {
                    const result = await createPlayground(payload);
                    lastSavedRef.current = currentData;
                    if (options.onSave) options.onSave(result);
                } else {
                    throw fetchErr;
                }
            }
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
                const payload = {
                    assignment_id: assignmentId,
                    item: data,
                    status: 'in_progress',
                };

                try {
                    // Try to get existing playground
                    const existing = await getMyPlayground(assignmentId);
                    if (existing) {
                        // Update existing
                        const result = await updatePlayground(payload);
                        lastSavedRef.current = currentData;
                        if (options.onSave) options.onSave(result);
                    } else {
                        // Create new
                        const result = await createPlayground(payload);
                        lastSavedRef.current = currentData;
                        if (options.onSave) options.onSave(result);
                    }
                } catch (fetchErr: any) {
                    // If 404, create new playground
                    if (fetchErr.message?.includes('404') || fetchErr.message?.includes('not found')) {
                        const result = await createPlayground(payload);
                        lastSavedRef.current = currentData;
                        if (options.onSave) options.onSave(result);
                    } else {
                        throw fetchErr;
                    }
                }
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
        const playground = await getMyPlayground(assignmentId);

        if (playground) {
            return playground;
        }
        return null;
    } catch (e) {
        console.error('[DB] Failed to load playground:', e);
        return null;
    }
}
