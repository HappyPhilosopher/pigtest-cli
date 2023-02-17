import axios from 'axios';

const BASE_URL = 'http://api.painfulpig.cn:7001';
const service = axios.create({
	baseURL: BASE_URL,
	timeout: 5000
});

service.interceptors.response.use(
	response => response.data,
	error => Promise.reject(error)
);

export default service;
