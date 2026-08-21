const assert = require('node:assert/strict');
const { test } = require('node:test');

const method = require('../../src/method');

test('creates PHPDoc for typed parameters and a return type', function () {
    assert.equal(
        method.comment('public function greet(string $name): string'),
        '/**\n * greet\n *\n * @param  string $name\n * @return string\n */'
    );
});

test('handles an unterminated block comment without hanging', function () {
    assert.equal(
        method.comment('function example(/* unterminated'),
        '/**\n * example\n *\n * @return void\n */'
    );
});
