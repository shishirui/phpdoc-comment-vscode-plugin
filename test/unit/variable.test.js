const assert = require('node:assert/strict');
const { test } = require('node:test');

const variable = require('../../src/variable');

test('preserves nullable, union, and namespaced property types', function () {
    assert.equal(
        variable.comment('private ?Domain\\Value $value;'),
        '/**\n * value\n *\n * @var ?Domain\\Value\n */'
    );
    assert.equal(
        variable.comment('public Result|false|null $result;'),
        '/**\n * result\n *\n * @var Result|false|null\n */'
    );
});

test('supports readonly and static typed properties', function () {
    assert.equal(
        variable.comment('public readonly static Collection $items;'),
        '/**\n * items\n *\n * @var Collection\n */'
    );
});

test('infers an untyped property default without returning undefined', function () {
    assert.equal(
        variable.comment('public $value = null;'),
        '/**\n * value\n *\n * @var null\n */'
    );
    assert.equal(
        variable.comment('protected $value = SOME_CONSTANT;'),
        '/**\n * value\n *\n * @var mixed\n */'
    );
});
