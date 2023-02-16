export default () => {
	return process.argv.includes('-d') || process.argv.includes('--debug');
};
