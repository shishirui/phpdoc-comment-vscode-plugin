const fs = require('fs');
const path = require('path');

function collectTestFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(function (entry) {
        const entryPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            return collectTestFiles(entryPath);
        }

        return entry.name.endsWith('.test.js') ? [entryPath] : [];
    });
}

async function runTestCase(testCase) {
    try {
        await testCase.fn();
        console.log('  PASS ' + testCase.name);
    } catch (err) {
        console.error('  FAIL ' + testCase.name);
        throw err;
    }
}

async function run() {
    const suites = [];
    let currentSuite = null;

    global.suite = function (name, fn) {
        const parentSuite = currentSuite;
        const suiteItem = {
            name,
            tests: []
        };

        suites.push(suiteItem);
        currentSuite = suiteItem;
        fn();
        currentSuite = parentSuite;
    };

    global.test = function (name, fn) {
        if (!currentSuite) {
            throw new Error('Test "' + name + '" must be declared inside a suite.');
        }

        currentSuite.tests.push({
            name,
            fn
        });
    };

    collectTestFiles(__dirname).forEach(function (file) {
        require(file);
    });

    for (const suiteItem of suites) {
        console.log(suiteItem.name);

        for (const testCase of suiteItem.tests) {
            await runTestCase(testCase);
        }
    }
}

module.exports = {
    run
};
