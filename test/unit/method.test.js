const assert = require('node:assert/strict');
const { test } = require('node:test');

const method = require('../../src/method');

test('creates PHPDoc for typed parameters and a return type', function () {
    assert.equal(
        method.comment('public function greet(string $name): string'),
        '/**\n * greet\n *\n * @param string $name\n * @return string\n */'
    );
});

test('handles an unterminated block comment without hanging', function () {
    assert.equal(
        method.comment('function example(/* unterminated'),
        '/**\n * example\n *\n * @return void\n */'
    );
});

test('preserves modern PHP parameter and return types', function () {
    assert.equal(
        method.comment('public function load(?string $id, \\DateTimeInterface $at): ?Domain\\Result'),
        '/**\n * load\n *\n * @param ?string $id\n * @param \\DateTimeInterface $at\n * @return ?Domain\\Result\n */'
    );
});

test('supports unions, intersections, references, and variadic parameters', function () {
    assert.equal(
        method.comment('function combine((Readable&Countable)|null &$source, string ...$names): Result|false'),
        '/**\n * combine\n *\n * @param (Readable&Countable)|null $source\n * @param string $names\n * @return Result|false\n */'
    );
});

test('supports multiline signatures and commas in nested defaults', function () {
    assert.equal(
        method.comment([
            'public function search(',
            '    array $filters = ["status" => ["new", "open"]],',
            '    callable $mapper = null,',
            '): Collection|array {'
        ].join('\n')),
        '/**\n * search\n *\n * @param array $filters\n * @param callable $mapper\n * @return Collection|array\n */'
    );
});

test('supports promoted constructor properties and parameter attributes', function () {
    assert.equal(
        method.comment('public function __construct(#[SensitiveParameter] private readonly Token $token, public ?int $count = null)'),
        '/**\n * __construct\n *\n * @param Token $token\n * @param ?int $count\n * @return void\n */'
    );
});

test('handles incomplete return syntax without throwing', function () {
    assert.equal(
        method.comment('public function draft():'),
        '/**\n * draft\n *\n * @return void\n */'
    );
});

test('supports functions that return by reference', function () {
    assert.equal(
        method.comment('public function &current(): Item'),
        '/**\n * current\n *\n * @return Item\n */'
    );
});
