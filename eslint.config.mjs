import js from '@eslint/js';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    {
        languageOptions: {
            ecmaVersion: 'latest',
            // globals: {
            //     ...globals.node
            // }
        },
		plugins: {
			js,
		},
		extends: ['js/recommended'],
        rules: {
            'no-extra-semi': 2,
            'no-implicit-globals': 2,
            'no-implied-eval': 2,
            'no-inner-declarations': 2,
            'no-invalid-this': 2,
            'no-irregular-whitespace': 2,
            'no-mixed-spaces-and-tabs': 2,
            'no-native-reassign': 2,
            'no-negated-in-lhs': 2,
            'no-unused-expressions': 2,
            'handle-callback-err': 2,
            'no-trailing-spaces': 2,
            'no-unused-vars': [2, {
                'argsIgnorePattern': 'ignored_',
                'varsIgnorePattern': 'ignored_',
                'caughtErrorsIgnorePattern': 'ignored_'
            }],
            'no-prototype-builtins': 2,
            'no-useless-escape': 2,
            'arrow-spacing': [2, {'before':true, 'after':true}],
            'func-call-spacing': [2, 'never'],
            'semi-spacing': [2, {'before': false, 'after': true}],
            'space-before-function-paren': [2, {'anonymous': 'never', 'named': 'never', 'asyncArrow': 'always'}],
            'brace-style': [2, '1tbs', {'allowSingleLine': true}],
            'no-eval': 2,
            'no-throw-literal': 2,
            'no-undef-init': 2,
            'no-useless-call': 2,
            'no-useless-computed-key': 2,
            'no-useless-concat': 2,
            'no-useless-constructor': 2,
            'no-useless-rename': 2,
            'block-scoped-var': 2,
            'callback-return': 2,
            'default-case': 2,
            'semi': 2,
            'quotes': [2, 'single', { 'avoidEscape': true }]
        }
    }
]);


