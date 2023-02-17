import Command from '@pigtest/command';
import { log } from '@pigtest/utils';
import createTemplate from './createTemplate.js';
import downloadTemplate from './downloadTemplate.js';
import installTemplate from './installTemplate.js';

/**
 * usage:
 * 1. pigtest init
 * 2. pigtest init aaa -t project -tp template-vue3 -f
 * 3. pigtest init aaa --type project --template template-vue3 -f
 */
class InitCommand extends Command {
	get command() {
		return 'init [name]';
	}

	get description() {
		return 'init project';
	}

	get options() {
		return [
			['-f, --force', '是否强制更新', false],
			['-t, --type <type>', '项目类型（值：project/page）'],
			['-tp, --template <template>', '模板名称']
		];
	}

	async action([name, opts]) {
		log.verbose('===>init args: ', name, opts);
		// 1. 选择项目模板，生成项目信息
		const templateInfo = await createTemplate(name, opts);
		log.verbose('===>templateInfo: ', templateInfo);
		// 2. 下载项目模板至缓存目录
		await downloadTemplate(templateInfo);
		// 3. 安装项目模板至项目目录
		await installTemplate(templateInfo, opts);
	}
}

function createInitCommand(commandInstance) {
	return new InitCommand(commandInstance);
}

export default createInitCommand;
