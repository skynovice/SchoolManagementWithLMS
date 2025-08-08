import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'$stores': path.resolve('./src/stores'),
			'$components': path.resolve('./src/components')
		}
	}
});