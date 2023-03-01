import log from './log.js';
import isDebug from './isDebug.js';
import { makeList, makeInput, makePassword } from './inquirer.js';
import getLatestVersion from './npm.js';
import request from './request.js';
import Github from './git/Github.js';
import Gitee from './git/Gitee.js';
import {
	getGitPlatform,
	clearCache,
	getGitRepoType,
	getGitRepoLoginName
} from './git/GitServer.js';
import {
	initGitServer,
	initGitType,
	createRemoteRepo
} from './git/gitUtils.js';

export {
	log,
	isDebug,
	makeList,
	makeInput,
	getLatestVersion,
	request,
	Github,
	Gitee,
	makePassword,
	getGitPlatform,
	clearCache,
	initGitServer,
	initGitType,
	getGitRepoType,
	getGitRepoLoginName,
	createRemoteRepo
};
