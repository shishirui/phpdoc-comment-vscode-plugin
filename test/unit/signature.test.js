const assert = require('node:assert/strict');
const { test } = require('node:test');

const signature = require('../../src/signature');

test('collects a multiline function declaration through its return type', function () {
    const lines = [
        'public function find(',
        '    string $id,',
        '    array $options = ["fields" => ["name", "email"]],',
        ')',
        ': Result|false',
        '{',
        '    return false;',
        '}'
    ];

    assert.equal(signature.collectDeclaration(lines), lines.slice(0, 6).join('\n'));
});

test('stops after a complete signature when the body brace is omitted', function () {
    const lines = [
        'public function find(string $id): Result',
        '$unrelated = true;'
    ];

    assert.equal(signature.collectDeclaration(lines), lines[0]);
});

test('collects a multiline typed property with a nested default', function () {
    const lines = [
        'private array $options = [',
        '    "headers" => ["Accept" => "application/json"],',
        '];',
        'public function next(): void {}'
    ];

    assert.equal(signature.collectDeclaration(lines), lines.slice(0, 3).join('\n'));
});

test('bounds incomplete declarations', function () {
    const lines = Array.from({ length: 100 }, function (_, index) {
        return index === 0 ? 'public function unfinished(' : '    string $value' + index + ',';
    });

    assert.equal(signature.collectDeclaration(lines).split('\n').length, 80);
});

test('detects supported declaration kinds', function () {
    assert.equal(signature.detectKind('public function run(): void'), 'function');
    assert.equal(signature.detectKind('readonly class Request {}'), 'class');
    assert.equal(signature.detectKind('private ?Foo\\Bar $value;'), 'property');
    assert.equal(signature.detectKind('return $value;'), '');
});

test('splits parameters only at top-level commas', function () {
    assert.deepEqual(
        signature.splitTopLevel('array $a = [1, 2], callable $b = null, string $c = "a,b"'),
        ['array $a = [1, 2]', ' callable $b = null', ' string $c = "a,b"']
    );
});
