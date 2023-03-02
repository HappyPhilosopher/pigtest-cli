import axios from 'axios';
import { GitServer } from './GitServer.js';
import log from '../log.js';

const BASE_URL = 'https://gitee.com/api/v5';

class Gitee extends GitServer {
	constructor() {
		super();
		// axios 实例
		this.service = axios.create({
			baseURL: BASE_URL,
			timeout: 5000
		});
		// axios 响应拦截
		this.service.interceptors.response.use(
			response => response.data,
			error => Promise.reject(error)
		);
	}

	get(url, params = {}, headers = {}) {
		return this.service({
			url,
			method: 'GET',
			params: {
				...params,
				access_token: this.token
			},
			headers
		});
	}

	post(url, data = {}, headers = {}) {
		return this.service({
			url,
			method: 'POST',
			data: {
				...data,
				access_token: this.token
			},
			headers: {
				...headers
			}
		});
	}

	searchRepositories(params) {
		return this.get('/search/repositories', params);
	}

	/**
	 * 获取远程仓库 git 下载地址
	 * 示例：https://gitee.com/painful_pig/test-dir.git
	 * @date 2023-03-02
	 * @param {String} fullName
	 * @returns {String}
	 */
	getRepoUrl(fullName) {
		return `https://gitee.com/${fullName}.git`;
	}

	getUser() {
		return this.get('/user');
	}

	getOrgs() {
		return this.get('/user/orgs');
	}

	/**
	 * 获取某个仓库，个人和组织均可查询
	 * @date 2023-03-02
	 * @param {String} owner
	 * @param {String} repo
	 * @returns {Object}
	 */
	getRepo(owner, repo) {
		return this.get(`/repos/${owner}/${repo}`).catch(() => {
			log.info(`仓库${repo}不存在，正在创建`);
		});
	}

	async createRepo(projectName) {
		// 获取当前想要创建的仓库
		const repo = await this.getRepo(this.repoLoginName, projectName);
		// 判断当前想要创建的仓库是否存在，存在就返回 null 并做提示
		if (repo) {
			log.info(
				`${this.repoType === 'user' ? '个人' : '组织'}仓库${projectName}已存在`
			);
			return null;
		}

		if (this.repoType === 'user') {
			return this.post('/user/repos', { name: projectName }).then(() => {
				log.info(`个人仓库${projectName}创建成功`);
			});
		}
		return this.post(`/orgs/${this.repoLoginName}/repos`, {
			name: projectName
		}).then(() => {
			log.info(`组织仓库${projectName}创建成功`);
		});
	}
}

export default Gitee;
