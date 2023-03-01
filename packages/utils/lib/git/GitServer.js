import path from 'node:path';
import fs from 'node:fs';
import { homedir } from 'node:os';
import fse from 'fs-extra';
import { makePassword } from '../inquirer.js';
import log from '../log.js';

const TEMP_HOME = '.pigtest';
const TEMP_TOKEN = '.git_token';
const TEMP_PLATFORM = '.git_platform';
const TEMP_REPO_TYPE = '.git_repo_type';
const TEMP_REPO_LOGIN_NAME = '.git_repo_login_name';

/**
 * 生成 token 缓存地址
 * @date 2023-02-28
 * @returns {String}
 */
function createTokenPath() {
	return path.resolve(homedir(), TEMP_HOME, TEMP_TOKEN);
}

/**
 * 生成 git 平台缓存地址
 * @date 2023-02-28
 * @returns {String}
 */
function createPlatformPath() {
	return path.resolve(homedir(), TEMP_HOME, TEMP_PLATFORM);
}

/**
 * 生成仓库类型缓存地址
 * @date 2023-02-28
 * @returns {String}
 */
function createRepoTypePath() {
	return path.resolve(homedir(), TEMP_HOME, TEMP_REPO_TYPE);
}

/**
 * 生成仓库登录名称缓存地址
 * @date 2023-02-28
 * @returns {String}
 */
function createRepoLoginNamePath() {
	return path.resolve(homedir(), TEMP_HOME, TEMP_REPO_LOGIN_NAME);
}

/**
 * 获取缓存的 git 平台信息
 * @date 2023-02-28
 * @returns {String}
 */
function getGitPlatform() {
	const gitPlatformPath = createPlatformPath();
	if (fs.existsSync(gitPlatformPath)) {
		return fs.readFileSync(gitPlatformPath).toString();
	}
	return null;
}

/**
 * 获取缓存的仓库类型
 * @date 2023-02-28
 * @returns {String}
 */
function getGitRepoType() {
	const gitRepoType = createRepoTypePath();
	if (fs.existsSync(gitRepoType)) {
		return fs.readFileSync(gitRepoType).toString();
	}
	return null;
}

/**
 * 获取缓存的仓库登录名称
 * @date 2023-02-28
 * @returns {String}
 */
function getGitRepoLoginName() {
	const gitRepoLoginName = createRepoLoginNamePath();
	if (fs.existsSync(gitRepoLoginName)) {
		return fs.readFileSync(gitRepoLoginName).toString();
	}
	return null;
}

/**
 * 清除 git 平台缓存文件、 token 缓存文件、仓库类型缓存文件、仓库登录名称缓存文件
 * @date 2023-03-01
 */
function clearCache() {
	const platformPaht = createPlatformPath();
	const tokenPath = createTokenPath();
	const repoTypePath = createRepoTypePath();
	const repoLoginName = createRepoLoginNamePath();
	fse.removeSync(platformPaht);
	fse.removeSync(tokenPath);
	fse.removeSync(repoTypePath);
	fse.removeSync(repoLoginName);
}

class GitServer {
	async init() {
		// 判断 token 是否录入
		const tokenPath = createTokenPath();

		if (fs.existsSync(tokenPath)) {
			this.token = fse.readFileSync(tokenPath).toString();
		} else {
			const token = await this.getToken();
			this.token = token;
			fs.writeFileSync(tokenPath, this.token);
		}
		log.verbose('===>token: ', this.token);
	}

	getToken() {
		return makePassword({
			message: '请输入token'
		});
	}

	savePlatform(platform) {
		this.platform = platform;
		fs.writeFileSync(createPlatformPath(), platform);
	}

	saveRepoType(repoType) {
		this.repoType = repoType;
		fs.writeFileSync(createRepoTypePath(), repoType);
	}

	saveRepoLoginName(repoLoginName) {
		this.repoLoginName = repoLoginName;
		fs.writeFileSync(createRepoLoginNamePath(), repoLoginName);
	}

	getUser() {
		throw new Error('getUser must be implemented!');
	}

	getOrgs() {
		throw new Error('getOrgs must be implemented!');
	}

	getPlatform() {
		return this.platform;
	}

	getRepoType() {
		return this.repoType;
	}

	getRepoLoginName() {
		return this.repoLoginName;
	}

	createRepo() {
		throw new Error('createRepo must be implemented!');
	}
}

export {
	getGitPlatform,
	GitServer,
	clearCache,
	getGitRepoType,
	getGitRepoLoginName
};
