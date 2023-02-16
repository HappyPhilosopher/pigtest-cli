import inquirer from 'inquirer';

function make({
	choices,
	defaultValue,
	message = '请选择',
	type = 'list',
	require = true,
	mask = '*',
	validate,
	pageSize,
	loop
}) {
	const options = {
		name: 'name',
		default: defaultValue,
		message,
		type,
		require,
		mask,
		validate,
		pageSize,
		loop
	};

	if (type === 'list') {
		options.choices = choices;
	}
	return inquirer.prompt(options).then(answer => answer.name);
}

/**
 * 创建询问列表
 * @param {Object} params
 * @returns
 */
export function makeList(params) {
	return make({ ...params });
}

/**
 * 创建询问输入框
 * @param {Object} params
 * @returns
 */
export function makeInput(params) {
	return make({
		...params,
		type: 'input'
	});
}
