import path from 'node:path';
import fs from 'node:fs';
import { homedir } from 'node:os';
import fse from 'fs-extra';
import { makePassword } from '../inquirer.js';
import log from '../log.js';

const TEMP_HOME = '.pigtest';
const TEMP_TOKEN = '.token';
const TEMP_PLATFORM = '.git_platform';

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
 * 获取缓存的 git 平台信息
 * @date 2023-02-28
 * @returns {String}
 */
function getGitPlatform() {
	if (fs.existsSync(createPlatformPath())) {
		return fs.readFileSync(createPlatformPath()).toString();
	}
	return null;
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
		fs.writeFileSync(createPlatformPath(), platform);
	}
}

export { getGitPlatform, GitServer };
