import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			out: 'build'
		}),
		alias: {
			'$stores': 'src/stores',
			'$components': 'src/components'
		}
	}
};

export default config;