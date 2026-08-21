const fs = require('fs');
const os = require('os');
const path = require('path');

const { downloadAndUnzipVSCode, runTests } = require('@vscode/test-electron');

async function resolveExecutablePath() {
    if (process.env.VSCODE_EXECUTABLE_PATH) {
        return process.env.VSCODE_EXECUTABLE_PATH;
    }

    const version = process.env.VSCODE_TEST_VERSION || '1.134.0';
    const downloadedPath = await downloadAndUnzipVSCode(version);
    if (fs.existsSync(downloadedPath)) {
        return downloadedPath;
    }

    const macOSCodePath = downloadedPath.replace(/\/Electron$/, '/Code');
    if (process.platform === 'darwin' && fs.existsSync(macOSCodePath)) {
        return macOSCodePath;
    }

    return downloadedPath;
}

async function main() {
    const extensionDevelopmentPath = path.resolve(__dirname, '..');
    const extensionTestsPath = path.resolve(__dirname, 'suite');
    const vscodeExecutablePath = await resolveExecutablePath();
    const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'phpdoc-vscode-test-'));

    try {
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            vscodeExecutablePath,
            launchArgs: [
                '--user-data-dir=' + path.join(temporaryRoot, 'user-data'),
                '--extensions-dir=' + path.join(temporaryRoot, 'extensions'),
                '--disable-workspace-trust'
            ]
        });
    } finally {
        fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
}

main().catch(function (err) {
    console.error('Failed to run tests');
    console.error(err);
    process.exit(1);
});
