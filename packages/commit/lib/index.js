import path from 'node:path';
import fse from 'fs-extra';
import Command from '@pigtest/command';
import {
	initGitServer,
	initGitType,
	clearCache,
	createRemoteRepo
} from '@pigtest/utils';

class CommitCommand extends Command {
	get command() {
		return 'commit';
	}

	get description() {
		return 'commit project';
	}

	get options() {
		return [['-c, --clear', '清空缓存', false]];
	}

	async action([{ clear }]) {
		if (clear) {
			clearCache();
		}
		this.createremoteRepo();
	}

	/**
	 * 阶段1：创建远程仓库
	 * @date 2023-02-28
	 * @returns {any}
	 */
	async createremoteRepo() {
		// 1. 实例化 git 对象
		this.gitApi = await initGitServer();
		// 2. 仓库类型选择
		await initGitType(this.gitApi);
		// 3. 创建远程仓库
		const dir = process.cwd();
		const pkg = fse.readJsonSync(path.resolve(dir, 'package.json'));
		await createRemoteRepo(this.gitApi, pkg.name);
	}
}

function createCommitCommand(instance) {
	return new CommitCommand(instance);
}

export default createCommitCommand;
