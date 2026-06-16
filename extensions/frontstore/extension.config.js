import fs from 'fs';

export default {
	plugins: [
		{
			name: 'my-build-hooks',

			writeBundle() {
				const now = new Date();

				fs.utimesSync(
					'package.json',
					now,
					now
				);
			},
		}
	]
};