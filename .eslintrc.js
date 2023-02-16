module.exports = {
	env: {
		es2021: true,
		node: true
	},
	extends: ['airbnb-base', 'plugin:prettier/recommended'],
	overrides: [],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module'
	},
	rules: {
		'linebreak-style': 0,
		'no-console': process.env.NODE_ENV === 'production' ? 2 : 0,
		'import/extensions': [2, 'ignorePackages'],
		'class-methods-use-this': 0
	}
};
