import Command from '@pigtest/command';

class InitCommand extends Command {
	get command() {
		return 'init [name]';
	}

	get description() {
		return 'init project';
	}

	get options() {
		return [['-f, --force', '是否强制更新', false]];
	}

	action([name, opts]) {
		console.log('===>init: ', name, opts);
	}
}

function createInitCommand(commandInstance) {
	return new InitCommand(commandInstance);
}

export default createInitCommand;
