import urlJoin from 'url-join';
import axios from 'axios';
import log from './log.js';

function getNpmInfo(npmName) {
	// 淘宝镜像：https://registry.npmmirror.com/
	const registry = 'https://registry.npmjs.org';
	const url = urlJoin(registry, npmName);

	return axios.get(url).then(res => {
		try {
			return res.data;
		} catch (e) {
			return Promise.reject(e);
		}
	});
}

export default function getLatestVersion(npmName) {
	return getNpmInfo(npmName).then(res => {
		if (!res['dist-tags'] || !res['dist-tags'].latest) {
			log.error('===>没有 latest 版本号');
			return Promise.reject(new Error('没有 latest 版本号'));
		}
		return res['dist-tags'].latest;
	});
}
