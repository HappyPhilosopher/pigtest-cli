import path from 'node:path';
import fs from 'node:fs';
import fse from 'fs-extra';
import simpleGit from 'simple-git';
import Command from '@pigtest/command';
import {
	initGitServer,
	initGitType,
	clearCache,
	createRemoteRepo,
	log
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
		await this.createremoteRepo();
		await this.initLocal();
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
		this.name = pkg.name;
		await createRemoteRepo(this.gitApi, this.name);
		// 4. 生成 .gitignore
		const gitIgnorePath = path.resolve(dir, '.gitignore');
		if (!fs.existsSync(gitIgnorePath)) {
			log.info('.gitignore文件不存在，开始创建');
			fs.writeFileSync(
				gitIgnorePath,
				`
.DS_Store
node_modules
/dist


# local env files
.env.local
.env.*.local

# Log files
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor directories and files
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?			
				`
			);
			log.success('.gitignore文件创建创建成功');
		}
	}

	/**
	 * 阶段2：git 本地初始化
	 * @date 2023-03-02
	 * @returns {any}
	 */
	async initLocal() {
		const remoteUrl = this.gitApi.getRepoUrl(
			`${this.gitApi.repoLoginName}/${this.name}`
		);
		// 初始化 git 对象
		this.git = simpleGit(process.cwd());
		try {
			// 判断当前项目是否进行过 git 初始化
			const gitDir = path.resolve(process.cwd(), '.git');
			if (!fs.existsSync(gitDir)) {
				// git 初始化
				await this.git.init();
				log.success('完成git初始化');
			}
			// 获取所有的 remotes
			const remotes = await this.git.getRemotes();
			if (!remotes.find(remote => remote.name === 'origin')) {
				await this.git.addRemote('origin', remoteUrl);
				log.success('添加 git remote', remoteUrl);
			}
			// 获取当前 git 状态
			const status = await this.git.status();
			// 拉取远程 master 分支，实现代码同步
			await this.git.pull('origin', 'master').catch(err => {
				log.verbose('===>git pull origin master: ', err.message);
				if (err.message.includes("couldn't find remote ref master")) {
					log.error('获取远程[master]分支失败');
				}
			});
		} catch (err) {
			log.error(err);
		}
	}
}

function createCommitCommand(instance) {
	return new CommitCommand(instance);
}

export default createCommitCommand;
