/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testRegex: '.test.ts$',
    rootDir: 'src/__tests__',
    snapshotResolver: '../../jest.snapshots.js',
};
