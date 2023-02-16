import { log } from '@pigtest/utils';

class Command {
	constructor(commandInstance) {
		if (!commandInstance) {
			throw new Error('command instance must not be null!');
		}

		this.program = commandInstance;

		const cmd = this.program.command(this.command);
		cmd.description(this.description);

		// 生命周期钩子
		cmd.hook('preAction', (thisCommand, actionCommand) => {
			log.info(
				`====== ${actionCommand.name()} 命令开始执行，参数：${
					actionCommand.args
				}，选项：${JSON.stringify(actionCommand.opts())} ======`
			);
		});
		cmd.hook('postAction', (thisCommand, actionCommand) => {
			log.info(`====== ${actionCommand.name()} 命令执行完毕 ======`);
		});

		if (this.options && this.options.length > 0) {
			this.options.forEach(option => {
				cmd.option(...option);
			});
		} else {
			log.warn(`===>${this.command} 未提供 option 参数`);
		}
		cmd.action((...params) => {
			this.action(params);
		});
	}

	get command() {
		throw new Error('command must be implemented!');
	}

	get description() {
		throw new Error('description must be implemented!');
	}

	/**
	 * 一组参数是一个数组，实现该 getter 时返回值为二维数组，如 [[...], [...]]
	 */
	get options() {
		return [];
	}

	action() {
		throw new Error('action must be implemented!');
	}
}

export default Command;
