import path from 'path';
import { program } from 'commander';
import fse from 'fs-extra';
import { dirname } from 'dirname-filename-esm';
import semver from 'semver';
import chalk from 'chalk';
import { log } from '@pigtest/utils';
import './exception.js';

// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(import.meta);
const pkg = fse.readJsonSync(path.resolve(__dirname, '../package.json'));
const LOWEST_NODE_VERSION = '14.0.0';

/**
 * 检查 node 版本并与最低要求的版本进行比较
 */
function checkNodeVersion() {
	const nodeVersion = process.version;
	log.verbose('===>node version: ', nodeVersion);

	if (!semver.gte(nodeVersion, LOWEST_NODE_VERSION)) {
		throw new Error(
			chalk.red(`pigtest 需要安装 ${LOWEST_NODE_VERSION} 以上版本的 node.js.`)
		);
	}
}

/**
 * 命令预检查
 */
function preAction() {
	checkNodeVersion();
}

/**
 * 创建脚手架
 */
export default () => {
	program
		.name(Object.keys(pkg.bin)[0])
		.usage('<command> [options]')
		.version(pkg.version)
		.option('-d, --debug', '是否开启调试模式', false)
		.hook('preAction', preAction);

	program.on('option:debug', () => {
		if (program.opts().debug) {
			log.verbose('===>debug: 开启 debug 模式');
		}
	});

	program.on('command:*', commands => {
		log.error('===>未知命令：', commands[0]);
	});

	return program;
};
