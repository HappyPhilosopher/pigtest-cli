import log from '../log.js';
import {
	getGitPlatform,
	getGitRepoType,
	getGitRepoLoginName
} from './GitServer.js';
import { makeList } from '../inquirer.js';
import Gitee from './Gitee.js';
import Github from './Github.js';

/**
 * 初始化 gitApi 方法
 * @date 2023-02-28
 * @returns {Object}
 */
async function initGitServer() {
	const platform =
		getGitPlatform() ||
		(await makeList({
			message: '请选择Git平台',
			choices: [
				{ name: 'GitHub', value: 'github' },
				{ name: 'Gitee', value: 'gitee' }
			]
		}));
	log.verbose('===>git platform: ', platform);
	let gitApi;

	if (platform === 'github') {
		gitApi = new Github();
	} else {
		gitApi = new Gitee();
	}

	gitApi.savePlatform(platform);
	await gitApi.init();

	return gitApi;
}

/**
 * 初始化 git 类型并返回 git 登录名称
 * @date 2023-03-01
 * @param {Object} gitApi
 * @returns {String}
 */
async function initGitType(gitApi) {
	// 仓库类型
	let repoType = getGitRepoType();
	// 仓库登录名
	let repoLoginName = getGitRepoLoginName();

	if (!repoType && !repoLoginName) {
		const user = await gitApi.getUser();
		const orgs = await gitApi.getOrgs();

		if (!repoType) {
			repoType = await makeList({
				message: '请选择仓库类型',
				choices: [
					{ name: 'User', value: 'user' },
					{ name: 'Organization', value: 'org' }
				]
			});
		}

		if (!orgs || orgs.length === 0) {
			throw new Error('您还未加入任何组织');
		} else if (repoType === 'user') {
			repoLoginName = user?.login;
		} else {
			const orgsList = orgs.map(item => ({
				name: item.name || item.login,
				value: item.login
			}));
			repoLoginName = await makeList({
				message: '请选择组织名称',
				choices: orgsList
			});
		}
	}

	if (!repoType || !repoLoginName) {
		throw new Error(
			'未获取到用户的Git登录信息！请使用 "pigtest commit --clear" 清除缓存后重试'
		);
	}

	log.verbose('===>repoType: ', repoType);
	log.verbose('===>repoLoginName: ', repoLoginName);

	gitApi.saveRepoType(repoType);
	gitApi.saveRepoLoginName(repoLoginName);

	return repoLoginName;
}

/**
 * 创建远程仓库
 * @date 2023-03-01
 * @param {Object} gitApi Git 实例
 * @param {String} projectName 项目名（仓库名）
 * @returns {any}
 */
async function createRemoteRepo(gitApi, projectName) {
	await gitApi.createRepo(projectName);
}

export { initGitServer, initGitType, createRemoteRepo };
