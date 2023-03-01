import axios from 'axios';
import { GitServer } from './GitServer.js';

const BASE_URL = 'https://api.github.com';

class Github extends GitServer {
	constructor() {
		super();
		// axios 实例
		this.service = axios.create({
			baseURL: BASE_URL,
			timeout: 5000
		});
		// axios 请求拦截
		this.service.interceptors.request.use(
			config => {
				const newConfig = config;
				newConfig.headers.Authorization = `Bearer ${this.token}`;
				newConfig.headers.Accept = 'application/vnd.github+json';
				newConfig.headers['X-GitHub-Api-Version'] = '2022-11-28';
				return newConfig;
			},
			error => Promise.reject(error)
		);
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
			params,
			headers
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
}

export default Github;
