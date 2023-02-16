#!/usr/bin/env node

// 全局依赖与本地依赖优先选择本地
import importLocal from 'import-local';
// 命令行日志
import { log } from '@pigtest/utils';
// 解决 __dirname 和 __filename 在 esm 中的引用报错
import { filename } from 'dirname-filename-esm';
import entry from '../lib/index.js';
// 另一种解决方式
// import { fileURLToPath } from 'node:url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// eslint-disable-next-line no-underscore-dangle
const __filename = filename(import.meta);

if (importLocal(__filename)) {
	log.info('===>cli: ', '使用本地 pigtest 版本');
} else {
	/**
	 * process.argv 打印结果
	 * 1. 执行命令的环境，此处为 node.js 的安装地址
	 * 2. 执行命令的脚本地址
	 * [
	 *   'C:\\Program Files\\nodejs\\node.exe',
	 *   'C:\\Program Files\\nodejs\\node_modules\\@pigtest\\cli\\bin\\cli.js'
	 * ]
	 */
	entry(process.argv.slice(2));
}
