import createInitCommand from '@pigtest/init';
import createCLI from './createCLI.js';

export default () => {
	const program = createCLI();
	createInitCommand(program);

	program.parse(process.argv);
};
