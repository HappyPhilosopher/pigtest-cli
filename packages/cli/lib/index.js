import createInitCommand from '@pigtest/init';
import createDownloaderCommand from '@pigtest/downloader';
import createCLI from './createCLI.js';

export default () => {
	const program = createCLI();
	createInitCommand(program);
	createDownloaderCommand(program);

	program.parse(process.argv);
};
