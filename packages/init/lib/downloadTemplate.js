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
 * 下载模板到缓存目录
 * @param {String} targetPath
 * @param {Object} template
 */
async function downloadAddTemplate(targetPath, template) {
	const { npmName, version } = template;
	const installCommand = 'npm';
	const installArgs = ['install', `${npmName}@${version}`];
	const cwd = getCacheDir(targetPath);
	await execa(installCommand, installArgs, { cwd });
}

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
