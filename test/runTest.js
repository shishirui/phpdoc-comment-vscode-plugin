const path = require('path');

const { runTests } = require('@vscode/test-electron');

async function main() {
    const extensionDevelopmentPath = path.resolve(__dirname, '..');
    const extensionTestsPath = path.resolve(__dirname, 'suite');

    await runTests({
        extensionDevelopmentPath,
        extensionTestsPath
    });
}

main().catch(function (err) {
    console.error('Failed to run tests');
    console.error(err);
    process.exit(1);
});
