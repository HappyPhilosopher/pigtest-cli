import Command from '@pigtest/command';
import { Github, makeList, getGitPlatform, log, Gitee } from '@pigtest/utils';

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
		const platform =
			getGitPlatform() ||
			(await makeList({
				message: '请选择Git平台',
				choices: [
					{ name: 'GitHub', value: 'github' },
					{ name: 'Gittee', value: 'gittee' }
				]
			}));
		log.verbose('===>git platform: ', platform);
		let gitApi;

		if (platform === 'github') {
			gitApi = new Github();
		} else {
			gitApi = new Gitee();
		}

		gitApi.savePlatform(platform);
		await gitApi.init();
		this.gitApi = gitApi;
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
