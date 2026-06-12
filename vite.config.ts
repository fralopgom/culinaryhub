import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Culinary Hub',
				short_name: 'CulinaryHub',
				description: 'Preservación gastronómica cultural',
				theme_color: '#ffffff',
				icons: [{ src: '/favicon.png', sizes: '192x192', type: 'image/png' }]
			},
			workbox: {
				runtimeCaching: [{
					urlPattern: /\/[a-z]{2}\/recipes\/.+/,
					handler: 'StaleWhileRevalidate',
					options: { cacheName: 'recipes' }
				}]
			}
		}),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	]
});
