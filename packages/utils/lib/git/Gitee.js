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

	searchRepositories(params) {
		return this.get('/search/repositories', params);
	}
}

export default Gitee;
