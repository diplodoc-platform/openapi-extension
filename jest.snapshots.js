module.exports = {
    testPathForConsistencyCheck: 'src/__tests__/basic.test.ts',

    resolveSnapshotPath: (testPath, snapshotExtension) => {
        return testPath.replace('src/__tests__', 'src/__snapshots__') + snapshotExtension;
    },

    resolveTestPath: (snapshotFilePath, snapshotExtension) => {
        return snapshotFilePath
            .replace('src/__snapshots__', 'src/__tests__')
            .slice(0, -snapshotExtension.length);
    },
};
