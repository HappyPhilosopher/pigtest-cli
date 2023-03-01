import Command from '@pigtest/command';
import { initGitServer } from '@pigtest/utils';

class DownloaderCommand extends Command {
	get command() {
		return 'download';
	}

	get description() {
		return 'download project';
	}

	get options() {
		return '';
	}

	async action() {
		await this.generateGitApi();
		await this.searchGitApi();
	}

	async generateGitApi() {
		this.gitApi = await initGitServer();
	}

	/**
	 * TODO...
	 * 目前只实现了单个平台搜索，未进行整合
	 */
	async searchGitApi() {
		// gitee
		// const searchResult = await this.gitApi.searchRepositories({
		// 	q: 'vue',
		// 	language: 'JavaScript',
		// 	order: 'desc',
		// 	sort: 'stars_count',
		// 	per_page: 5,
		// 	page: 1
		// });
		// console.log(searchResult);

		const searchResult = await this.gitApi.searchRepositories({
			q: 'vue+language:vue',
			order: 'desc',
			sort: 'stars_count',
			per_page: 5,
			page: 1
		});
		console.log(searchResult);
	}
}

function createDownloaderCommand(instance) {
	return new DownloaderCommand(instance);
}

export default createDownloaderCommand;
