import fs from 'node:fs';
import path from 'node:path';
import fse from 'fs-extra';
import ora from 'ora';
import ejs from 'ejs';
import glob from 'glob';
import { log } from '@pigtest/utils';

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
 * 将目标文件从一个地址拷贝到目标地址
 * @param {String} targetPath
 * @param {String} template
 * @param {String} installDir
 */
function copyFile(targetPath, template, installDir) {
	const originFile = getCacheFilePath(targetPath, template);
	fse.copySync(originFile, installDir);
}

/**
 * ejs 渲染文件
 * @param {String} installDir
 * @param {Object} templateInfo
 */
async function ejsRender(installDir, templateInfo) {
	const {
		name,
		template: { ignore }
	} = templateInfo;
	const ejsData = {
		data: {
			name
		}
	};
	const defaultIgnore = [
		'**/node_modules/**',
		'**/*.png',
		'**/*.gif',
		'**/*.jpg',
		'**/*.jpeg',
		'**/*.svg'
	];
	const ignoreFiles = ignore ? defaultIgnore.concat(...ignore) : defaultIgnore;

	glob(
		'**',
		{
			cwd: installDir,
			nodir: true,
			ignore: ignoreFiles
		},
		(err, files) => {
			files.forEach(file => {
				const filePath = `${installDir}/${file}`;
				log.verbose('===>ejs file path: ', filePath);
				ejs.renderFile(filePath, ejsData, (e, res) => {
					if (e) {
						console.log(filePath);
						throw new Error(e);
					}
					fs.writeFileSync(filePath, res);
				});
			});
		}
	);
}

export default async function installTemplate(templateInfo, opts) {
	const { force = false } = opts;
	const { targetPath, name, template } = templateInfo;
	const rootDir = process.cwd();
	fse.ensureDirSync(targetPath);
	const installDir = path.resolve(`${rootDir}/${name}`);

	if (fs.existsSync(installDir)) {
		if (!force) {
			log.error(`当前目录下已存在 ${installDir} 文件夹`);
			return;
		}
		const removeSpinner = ora('正在删除文件……').start();
		fse.removeSync(installDir);
		removeSpinner.stop();
		fse.ensureDirSync(installDir);
	} else {
		fse.ensureDirSync(installDir);
	}

	const copySpinner = ora('正在拷贝文件……').start();
	copyFile(targetPath, template, installDir);
	copySpinner.stop();
	log.success('===>模板拷贝成功！');

	await ejsRender(installDir, templateInfo);
}
