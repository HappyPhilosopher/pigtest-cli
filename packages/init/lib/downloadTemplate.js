import path from 'node:path';
import fs from 'node:fs';
import { mkdirpSync } from 'fs-extra';
import ora from 'ora';
import { execa } from 'execa';
import { log } from '@pigtest/utils';

/**
 * 获取缓存目录
 * @param {String} targetPath
 * @returns
 */
function getCacheDir(targetPath) {
	return path.resolve(targetPath, 'node_modules');
}

/**
 * 创建缓存目录
 * @param {String} targetPath
 */
function makeCacheDir(targetPath) {
	const cacheDir = getCacheDir(targetPath);
	if (!fs.existsSync(cacheDir)) {
		mkdirpSync(cacheDir);
	}
}

/**
 * 判断文件夹是否为空
 * @param {String} dirPath
 * @returns
 */
function isDirEmpty(dirPath) {
	if (!fs.existsSync(dirPath)) {
		return true;
	}
	return fs.readdirSync(dirPath).length === 0;
}

/**
 * 获取缓存地址
 * @param {String} targetPath
 * @param {String} template
 * @returns
 */
function getCacheFilePath(targetPath, template) {
	return path.resolve(targetPath, 'node_modules', template.npmName, 'template');
}

/**
 * 创建下载文件的脚本
 * @param {String} targetPath
 * @param {Object} template
 */
async function downloadAddTemplate(targetPath, template) {
	const cacheFilePath = getCacheFilePath(targetPath, template);
	if (!isDirEmpty(cacheFilePath)) {
		return;
	}

	const { npmName, version } = template;
	const installCommand = 'npm';
	const installArgs = ['install', `${npmName}@${version}`];
	const cwd = getCacheDir(targetPath);
	await execa(installCommand, installArgs, { cwd });
}

/**
 * 下载模板文件到缓存目录
 * @param {Object} templateInfo
 */
export default async function downloadTemplate(templateInfo) {
	const { targetPath, template } = templateInfo;
	makeCacheDir(targetPath);
	const spinner = ora('正在下载模板……').start();
	try {
		await downloadAddTemplate(targetPath, template);
		spinner.stop();
		log.success('===>模板下载成功！');
	} catch (e) {
		spinner.stop();
		log.error(e.message);
	}
}
