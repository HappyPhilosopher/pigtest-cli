import fs from 'node:fs';
import path from 'node:path';
import fse from 'fs-extra';
import ora from 'ora';
import { log } from '@pigtest/utils';

function getCacheFilePath(targetPath, template) {
	return path.resolve(targetPath, 'node_modules', template.npmName, 'template');
}

function copyFile(targetPath, template, installDir) {
	const originFile = getCacheFilePath(targetPath, template);
	fse.copySync(originFile, installDir);
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
		fse.removeSync(installDir);
		fse.ensureDirSync(installDir);
	} else {
		fse.ensureDirSync(installDir);
	}

	const spinner = ora('正在拷贝文件……').start();
	copyFile(targetPath, template, installDir);
	spinner.stop();
	log.success('===>模板拷贝成功！');
}
