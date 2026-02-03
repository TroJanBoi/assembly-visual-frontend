import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * Limits the rate at which a value updates.
 * Useful for search inputs, auto-saving, or expensive calculations.
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set a timeout to update the debounced value after the delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clear the timeout if the value changes (or component unmounts)
        // This effectively resets the timer, creating the debounce effect
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
