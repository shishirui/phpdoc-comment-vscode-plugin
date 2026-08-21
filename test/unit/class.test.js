const assert = require('node:assert/strict');
const { test } = require('node:test');

const classDeclaration = require('../../src/class');
const signature = require('../../src/signature');

test('creates comments for classes, interfaces, traits, and enums', function () {
    assert.equal(classDeclaration.comment('readonly class Request {}'), '/**\n * Request\n */');
    assert.equal(classDeclaration.comment('interface Repository {}'), '/**\n * Repository\n */');
    assert.equal(classDeclaration.comment('trait LogsEvents {}'), '/**\n * LogsEvents\n */');
    assert.equal(classDeclaration.comment('enum Status: string {}'), '/**\n * Status\n */');
});

test('does not classify anonymous classes as named declarations', function () {
    assert.equal(signature.detectKind('return new class extends Base {};'), '');
    assert.equal(signature.detectKind('return new class implements Contract {};'), '');
});
