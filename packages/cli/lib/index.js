import createInitCommand from '@pigtest/init';
import createDownloaderCommand from '@pigtest/downloader';
import createCommitCommand from '@pigtest/commit';
import createCLI from './createCLI.js';

export default () => {
	const program = createCLI();
	createInitCommand(program);
	createDownloaderCommand(program);
	createCommitCommand(program);

	program.parse(process.argv);
};
