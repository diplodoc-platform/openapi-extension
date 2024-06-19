module.exports = {
    extends: ['@diplodoc/eslint-config'],
    root: true,
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                sourceType: 'module',
                project: ['./src/__tests__/tsconfig.json', './tsconfig.json'],
                tsconfigRootDir: __dirname,
            },
        },
    ],
};
