import { homedir } from 'node:os';
import path from 'node:path';
import {
	log,
	makeList,
	makeInput,
	getLatestVersion,
	request
} from '@pigtest/utils';

const ADD_TYPE_PROJECT = 'project';
const ADD_TYPE_PAGE = 'page';
const ADD_TYPE = [
	{
		name: '项目',
		value: ADD_TYPE_PROJECT
	},
	{
		name: '页面',
		value: ADD_TYPE_PAGE
	}
];
const TEMP_HOME = '.pigtest';

/**
 * 获取创建类型
 * @returns {Promise<Object>} inquirer answer
 */
function getAddType() {
	return makeList({
		choices: ADD_TYPE,
		message: '请选择初始化类型',
		defaultValue: ADD_TYPE_PROJECT
	});
}

/**
 * 获取项目名称
 */
function getAddName() {
	return makeInput({
		message: '请输入项目名称',
		defaultValue: '',
		validate(v) {
			if (v.length > 0) {
				return true;
			}
			return '项目名称必须输入';
		}
	});
}

/**
 * 选择项目模板
 */
function getAddTemplate(templates) {
	return makeList({
		message: '请选择项目模板',
		choices: templates
	});
}

/**
 * 安装缓存目录
 */
function makeTargetPath() {
	return path.resolve(homedir(), TEMP_HOME, 'addTemplate');
}

/**
 * 通过API获取项目模板
 */
async function getTemplateFromAPI() {
	try {
		const data = await request.get('/v1/projects');
		return data;
	} catch (e) {
		log.error(e);
		return null;
	}
}

/**
 * 选择团队
 * @param {Array} team
 * @returns
 */
function getAddTeam(team) {
	return makeList({
		choices: team.map(item => ({ name: item, value: item })),
		message: '请选择团队'
	});
}

/**
 * 创建项目模板信息
 * @param {String} name 项目名称
 * @param {Object} opts 参数选项
 * @returns 项目模板信息
 */
export default async function createTemplate(name, opts) {
	// 获取API项目模板
	const ADD_TEMPLATE = await getTemplateFromAPI();
	log.verbose('===>ADD_TEMPLATE: ', ADD_TEMPLATE);
	if (!ADD_TEMPLATE) {
		throw new Error('项目模板不存在');
	}

	const { type = null, template = null } = opts;
	// 项目名称
	let addName;
	// 项目模板
	let addTemplate;
	// 选择的模板信息
	let selectedTemplate;
	// 团队
	let addTeam;
	// 团队模板
	let teamTemplates;
	// 项目类型
	const addType = type || (await getAddType());
	log.verbose('===>addType: ', addType);

	if (addType === ADD_TYPE_PROJECT) {
		addName = name || (await getAddName());
		log.verbose('===>addName: ', addName);

		// 获取团队列表并选择所在团队
		if (!template) {
			const teamTags = ADD_TEMPLATE.map(item => item.team);
			const team = [...new Set(teamTags)];
			addTeam = await getAddTeam(team);
			log.verbose('===>addTeam: ', addTeam);
			teamTemplates = ADD_TEMPLATE.filter(item => item.team === addTeam);
		}
		addTemplate = template || (await getAddTemplate(teamTemplates, addTeam));
		log.verbose('===>addTemplate: ', addTemplate);
		// 根据是否选择团队确定模板信息
		selectedTemplate = ADD_TEMPLATE.find(item => item.value === addTemplate);
		if (!selectedTemplate) {
			throw new Error(`项目模板 ${addTemplate} 不存在！`);
		}
		log.verbose('===>selectedTemplate: ', selectedTemplate);
		// 获取最新 npm 版本号
		const latestVersion = await getLatestVersion(selectedTemplate.npmName);
		log.verbose('===>latestVersion: ', latestVersion);
		selectedTemplate.version = latestVersion;
		// 缓存目录
		const targetPath = makeTargetPath();

		return {
			type: addType,
			name: addName,
			template: selectedTemplate,
			targetPath
		};
	}

	throw new Error(`创建的类型 ${addType} 不支持`);
}
