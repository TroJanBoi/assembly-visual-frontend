"use client";

import { AppProgressBar } from "next-nprogress-bar";

export function NavigationLoader() {
    return (
        <AppProgressBar
            height="4px"
            color="#4f46e5"        // Indigo-600
            options={{ showSpinner: true, speed: 300, minimum: 0.2 }}
            shallowRouting
        />
    );
}
