const assert = require('node:assert/strict');
const { test } = require('node:test');

const util = require('../../src/util');

test('leaves text without comments unchanged', function () {
    assert.equal(util.stripComments('function example($value)'), 'function example($value)');
});

test('removes a closed block comment', function () {
    assert.equal(util.stripComments('before /* comment * content */ after'), 'before  after');
});

test('removes the remainder of an unterminated block comment', function () {
    assert.equal(util.stripComments('before /* unterminated'), 'before ');
});

test('removes a line comment and preserves the following line', function () {
    assert.equal(util.stripComments('before // comment\nafter'), 'before \nafter');
});

test('handles comment markers at the end of the input', function () {
    assert.equal(util.stripComments('before /*'), 'before ');
    assert.equal(util.stripComments('before //'), 'before ');
});
