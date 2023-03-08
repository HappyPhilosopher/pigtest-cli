import path from 'node:path';
import fs from 'node:fs';
import fse from 'fs-extra';
import simpleGit from 'simple-git';
import semver from 'semver';
import { execa } from 'execa';
import Command from '@pigtest/command';
import {
	clearCache,
	createRemoteRepo,
	initGitServer,
	initGitType,
	log,
	makeInput,
	makeList
} from '@pigtest/utils';

class CommitCommand extends Command {
	get command() {
		return 'commit';
	}

	get description() {
		return 'commit project';
	}

	get options() {
		return [
			['-c, --clear', '清空缓存', false],
			['-p, --publish', '发布', false]
		];
	}

	async action([{ clear, publish }]) {
		log.verbose('===>commit params: ', { clear, publish });
		if (clear) {
			clearCache();
		}
		await this.createremoteRepo();
		await this.initLocal();
		await this.commit();

		if (publish) {
			await this.publish();
		}
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
		const packageFilePath = path.resolve(dir, 'package.json');
		// package.json 文件不存在时，npm 初始化该目录
		if (!fs.existsSync(packageFilePath)) {
			log.info('开始执行 npm init -y 初始化目录');
			await execa('npm', ['init', '-y']);
			log.success('npm init -y 执行成功');
		}
		const pkg = fse.readJsonSync(packageFilePath);
		this.name = pkg.name;
		this.version = pkg.version || '1.0.0';
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
				// 检查未提交代码并进行 git commit
				await this.checkNotCommitted();
				// 检查是否存在远程 master 分支
				const tags = await this.git.listRemote(['--refs']);
				log.verbose('===>listRemote: ', tags);
				if (tags.includes('refs/heads/master')) {
					// 拉取远程 master 分支，实现代码同步
					await this.pullRemoteRepo('master', {
						'--allow-unrelated-histories': null
					});
				} else {
					// 推送代码到远程 master 分支
					await this.pushRemoteRepo('master');
				}
			}
		} catch (err) {
			log.error(err);
		}
	}

	/**
	 * 阶段3：代码自动化提交
	 * @date 2023-03-06
	 * @returns {any}
	 */
	async commit() {
		// 自动生成版本号
		await this.getCorrectVersion();
		// 检查 stash 区
		await this.checkstash();
		// 代码冲突检查
		await this.checkConflicted();
		// 检查未提交代码并自动提交
		await this.checkNotCommitted();
		// 检查本地分支并切换到开发分支
		await this.checkoutBranch(this.branch);
		// 拉取远程分支
		await this.pullRemoteMasterAndBranch();
		// 推送到远程仓库
		await this.pushRemoteRepo(this.branch);
	}

	/**
	 * 阶段4：代码发布
	 * @date 2023-03-08
	 * @returns {any}
	 */
	async publish() {
		// 检查本地和远程 tag 并进行创建、推送处理
		await this.checkTag();
		// 切换到本地 master 分支
		await this.checkoutBranch('master');
		// 将开发分支代码与 master 分支进行合并
		await this.mergeBranchToMaster();
		// 将代码推送到远程 master 分支
		await this.pushRemoteRepo('master');
		// 删除本地开发分支
		await this.deleteLocalBranch();
		// 删除远程开发分支
		await this.deleteRemoteBranch();
	}

	/**
	 * 检查代码是否提交，如未提交则进行提交，并输入提交信息
	 * @date 2023-03-06
	 * @returns {void}
	 */
	async checkNotCommitted() {
		const status = await this.git.status();

		if (
			status.not_added.length > 0 ||
			status.created.length > 0 ||
			status.deleted.length > 0 ||
			status.modified.length > 0 ||
			status.renamed.length > 0
		) {
			log.verbose('===>status: ', status);
			// git add
			await this.git.add(status.not_added);
			await this.git.add(status.created);
			await this.git.add(status.deleted);
			await this.git.add(status.modified);
			await this.git.add(status.renamed);
			// git commit
			const message = await makeInput({
				message: '请输入commit信息'
			});
			await this.git.commit(message);

			log.success('本地 commit 提交成功');
		}
	}

	/**
	 * 推送代码到远程分支
	 * @date 2023-03-06
	 * @param {String} branchName
	 * @returns {void}
	 */
	async pushRemoteRepo(branchName) {
		log.info(`推送代码至远程 ${branchName} 分支`);
		await this.git.push('origin', branchName);
		log.success('推送代码成功');
	}

	/**
	 * 获取正确的版本号信息
	 * @date 2023-03-06
	 * @returns {any}
	 */
	async getCorrectVersion() {
		log.info('获取代码分支');

		const remoteBranchList = await this.getRemoteBranchList('release');
		let releaseVersion;
		if (remoteBranchList && remoteBranchList.length > 0) {
			[releaseVersion] = remoteBranchList;
		} else {
			releaseVersion = null;
		}
		const devVersion = this.version;

		if (!releaseVersion) {
			this.branch = `dev/${devVersion}`;
		} else if (semver.gt(devVersion, releaseVersion)) {
			log.info(
				`当前版本号大于线上最新版本号: `,
				`${devVersion} >= ${releaseVersion}`
			);
			this.branch = `dev/${devVersion}`;
		} else {
			log.info(
				`当前线上版本号大于本地版本号: `,
				`${releaseVersion} >= ${devVersion}`
			);
			const incType = await makeList({
				message: '自动升级版本，请选择升级版本类型',
				defaultValue: 'patch', // x.y.z => major.minor.patch
				choices: [
					{
						name: `小版本 (${releaseVersion} -> ${semver.inc(
							releaseVersion,
							'patch'
						)})`,
						value: 'patch'
					},
					{
						name: `中版本 (${releaseVersion} -> ${semver.inc(
							releaseVersion,
							'minor'
						)})`,
						value: 'minor'
					},
					{
						name: `大版本 (${releaseVersion} -> ${semver.inc(
							releaseVersion,
							'major'
						)})`,
						value: 'major'
					}
				]
			});
			const incVersion = semver.inc(releaseVersion, incType);
			this.branch = `dev/${incVersion}`;
			this.version = incVersion;
			console.log(`${this.branch} === ${this.version}`);
			this.syncVersionToPackageJson();
		}
		log.success(`代码分支获取成功 ${this.branch}`);
	}

	/**
	 * 获取远程分支列表
	 * @date 2023-03-06
	 * @param {String} type release/dev
	 * @returns {String | null}
	 */
	async getRemoteBranchList(type) {
		const remoteList = await this.git.listRemote(['--refs']);
		let reg;
		if (type === 'release') {
			// 线上 release/0.0.1
			reg = /.+?refs\/tags\/release\/(\d+\.\d+\.\d+)/g;
		} else {
			// 本地 dev/0.0.1
			reg = /.+?refs\/tags\/dev\/(\d+\.\d+\.\d+)/g;
		}

		const finalRemoteList = remoteList
			.split('\n')
			.map(remote => {
				const match = reg.exec(remote);
				reg.lastIndex = 0;
				if (match && semver.valid(match[1])) {
					return match[1];
				}
				return null;
			})
			.filter(item => item)
			.sort((v1, v2) => semver.compare(v2, v1));

		log.verbose('===>remoteList: ', finalRemoteList);
		return finalRemoteList; // 版本号倒序排列
	}

	/**
	 * 同步本地 package.json 中的版本信息
	 * @date 2023-03-06
	 * @returns {void}
	 */
	syncVersionToPackageJson() {
		const dir = process.cwd();
		const pkgPath = path.resolve(dir, 'package.json');
		const pkg = fse.readJsonSync(pkgPath);

		if (pkg && pkg.version !== this.version) {
			pkg.version = this.version;
			fse.writeJsonSync(pkgPath, pkg, { spaces: 2 });
		}
	}

	/**
	 * 检查 stash 区，如果 stash 有内容则将其释放
	 * @date 2023-03-07
	 * @returns {void}
	 */
	async checkstash() {
		log.info('检查 stash 记录');
		const stashList = await this.git.stashList();
		if (stashList.all.length > 0) {
			await this.git.stash(['pop']);
			log.success('stash pop 成功');
		}
	}

	/**
	 * 代码冲突检查
	 * @date 2023-03-07
	 * @returns {void}
	 */
	async checkConflicted() {
		log.info('代码冲突检查');

		const status = await this.git.status();
		if (status.conflicted.length > 0) {
			throw new Error('当前代码存在冲突，请手动处理合并后再试');
		}

		log.info('代码冲突检查通过');
	}

	/**
	 * 检查本地分支并切换到开发分支
	 * @date 2023-03-07
	 * @param {String} branchName
	 * @returns {void}
	 */
	async checkoutBranch(branchName) {
		const localBranchList = await this.git.branchLocal();
		if (localBranchList.all.includes(branchName)) {
			await this.git.checkout(branchName);
		} else {
			await this.git.checkoutLocalBranch(branchName);
		}
		log.success(`本地分支切换到 ${branchName}`);
	}

	async pullRemoteMasterAndBranch() {
		log.info(`合并 [master] -> [${this.branch}]`);
		await this.pullRemoteRepo('master', {
			'--allow-unrelated-histories': null
		});
		log.info('合并远程 [master] 分支成功');

		log.info('检查远程分支');
		// this.getRemoteBranchList() 不传 type 默认为 type = dev
		const remoteBranchList = await this.getRemoteBranchList();
		if (remoteBranchList.includes(this.version)) {
			log.info(`合并 [${this.branch}] -> [${this.branch}]`);
			await this.pullRemoteRepo(this.branch);
			log.success(`合并远程 [${this.branch}] 分支成功`);
			await this.checkConflicted();
		} else {
			log.success(`不存在远程分支 [${this.branch}]`);
		}
	}

	/**
	 * 拉取并合并远程分支
	 * @date 2023-03-07
	 * @param {String} branchName
	 * @returns {void}
	 */
	async pullRemoteRepo(branchName = 'master', options = {}) {
		log.info(`同步远程 ${branchName} 分支代码`);
		// 拉取远程 master 分支，实现代码同步
		await this.git.pull('origin', branchName, options).catch(err => {
			log.error(`===>git pull origin ${branchName}: `, err.message);
			if (err.message.includes("couldn't find remote ref master")) {
				log.error('获取远程[master]分支失败');
			}
			process.exit(0);
		});
	}

	/**
	 * 检查 tag
	 * @date 2023-03-08
	 * @returns {any}
	 */
	async checkTag() {
		log.info('获取远程 tag 列表');
		const tag = `release/${this.version}`;

		// 删除远程 tag
		const tagList = await this.getRemoteBranchList('release');
		if (tagList.includes(this.version)) {
			log.info('===>远程 tag 已存在: ', tag);
			await this.git.push(['origin', `:refs/tags/${tag}`]);
			log.info('===>远程 tag 已删除: ', tag);
		}

		// 删除本地 tag
		const localTagList = await this.git.tags();
		if (localTagList.all.includes(tag)) {
			log.info('===>本地 tag 已存在: ', tag);
			await this.git.tag(['-d', tag]);
			log.success('===>本地 tag 已删除: ', tag);
		}

		await this.git.addTag(tag);
		log.success('===>本地 tag 创建成功: ', tag);
		await this.git.pushTags('origin');
		log.success('===>远程 tag 推送成功: ', tag);
	}

	/**
	 * 将开发分支代码与 master 分支进行合并
	 * @date 2023-03-08
	 * @returns {any}
	 */
	async mergeBranchToMaster() {
		log.info('===>开始合并代码: ', `[${this.branch}] -> [master]`);
		await this.git.mergeFromTo(this.branch, 'master');
		log.info('===>代码合并成功: ', `[${this.branch}] -> [master]`);
	}

	/**
	 * 删除本地开发分支
	 * @date 2023-03-08
	 * @returns {any}
	 */
	async deleteLocalBranch() {
		log.info('开始删除本地分支: ', this.branch);
		await this.git.deleteLocalBranch(this.branch);
		log.success('删除本地分支成功: ', this.branch);
	}

	/**
	 * 删除远程开发分支
	 * @date 2023-03-08
	 * @returns {any}
	 */
	async deleteRemoteBranch() {
		log.info('开始删除远程分支: ', this.branch);
		await this.git.push(['origin', '--delete', this.branch]);
		log.success('删除远程分支成功: ', this.branch);
	}
}

function createCommitCommand(instance) {
	return new CommitCommand(instance);
}

export default createCommitCommand;
