import { isDebug, log } from '@pigtest/utils';

/**
 * 打印错误信息
 * @param {Object} e Error信息
 */
function printErrorLog(e, errorType) {
	if (isDebug()) {
		log.error(errorType, e);
	} else {
		log.error(errorType, e.message);
	}
}

/**
 * 全局监听错误信息
 */
process.on('uncaughtException', e => printErrorLog(e, 'error: '));

process.on('unhandledRejection', e => printErrorLog(e, 'promise error: '));
