const assert = require('node:assert/strict');
const { test } = require('node:test');

const editor = require('../../src/editor');

function createDocument(lines) {
    return {
        lineAt: function (line) {
            return { text: lines[line] };
        }
    };
}

test('finds the first attached PHP attribute line', function () {
    const lines = [
        '    #[Route(',
        '        methods: ["GET", "POST"],',
        '    )]',
        '    #[RequiresAuth]',
        '    public function handle(): void {}'
    ];

    assert.equal(editor.findInsertionLine(createDocument(lines), 4), 0);
});

test('leaves the declaration line unchanged without attached attributes', function () {
    const lines = [
        '    $options = ["enabled" => true];',
        '    public function handle(): void {}'
    ];

    assert.equal(editor.findInsertionLine(createDocument(lines), 1), 1);
});

test('detects a leading PHPDoc block', function () {
    const lines = [
        '    /**',
        '     * Existing documentation.',
        '     */',
        '    #[RequiresAuth]',
        '    public function handle(): void {}'
    ];

    const insertionLine = editor.findInsertionLine(createDocument(lines), 4);
    assert.equal(insertionLine, 3);
    assert.equal(editor.hasLeadingDocBlock(createDocument(lines), insertionLine), true);
});

test('does not treat a regular block comment as PHPDoc', function () {
    const lines = [
        '    /* Internal note. */',
        '    public function handle(): void {}'
    ];

    assert.equal(editor.hasLeadingDocBlock(createDocument(lines), 1), false);
});
