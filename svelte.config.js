import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			runtime: 'nodejs20.x'
		}),
		alias: {
			'$stores': 'src/stores',
			'$components': 'src/components'
		}
	}
};

export default config;