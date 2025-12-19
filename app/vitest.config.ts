import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        alias: {
            '@': path.resolve(__dirname, './'),
            '@components': path.resolve(__dirname, './components')
        },
        // Exclude UI rendering tests for now if they exist, or just rely on path pattern
        exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    },
})
