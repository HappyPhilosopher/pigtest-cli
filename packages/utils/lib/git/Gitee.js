import axios from 'axios';
import { GitServer } from './GitServer.js';

const BASE_URL = 'https://gitee.com/api/v5';

class Gitee extends GitServer {
	constructor() {
		super();
		// axios 实例
		this.service = axios.create({
			baseURL: BASE_URL,
			timeout: 5000
		});
		this.service.defaults.headers.post['Content-Type'] =
			'application/x-www-form-urlencoded';
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

	getUser() {
		return this.get('/user');
	}

	getOrgs() {
		return this.get('/user/orgs');
	}

	createRepo(projectName) {
		if (this.repoType === 'user') {
			return this.post('/user/repos', { name: projectName });
		}
		return this.post(`/orgs/${this.repoLoginName}/repos`, {
			name: projectName
		});
	}
}

export default Gitee;
