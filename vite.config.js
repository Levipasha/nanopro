import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        react({
            // Allow JSX in .js files (same as CRA)
            include: '**/*.{js,jsx}',
        }),
    ],
    assetsInclude: ['**/*.glb'],
    esbuild: {
        // Treat .js files as JSX so existing CRA .js components work without renaming
        loader: 'jsx',
        include: /src\/.*\.js$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
    build: {
        outDir: 'build',
        chunkSizeWarningLimit: 2000,
    },
    server: {
        port: 3000,
    },
});
