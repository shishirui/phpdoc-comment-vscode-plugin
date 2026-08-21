/* global suite, test */

const assert = require('node:assert/strict');
const vscode = require('vscode');

async function runCommand(source, line) {
    const document = await vscode.workspace.openTextDocument({
        language: 'php',
        content: source
    });
    const editor = await vscode.window.showTextDocument(document);
    const position = new vscode.Position(line || 0, 0);
    editor.selection = new vscode.Selection(position, position);

    await vscode.commands.executeCommand('extension.addPHPComment');
    return document.getText();
}

suite('Extension Tests', function () {
    test('inserts a PHPDoc block above an indented multiline method', async function () {
        const source = [
            'class Example {',
            '    public function find(',
            '        ?string $id,',
            '        array $options = ["fields" => ["name", "email"]],',
            '    ): Result|false {',
            '    }',
            '}'
        ].join('\n');

        const actual = await runCommand(source, 1);
        assert.equal(actual, [
            'class Example {',
            '    /**',
            '     * find',
            '     *',
            '     * @param  ?string $id',
            '     * @param  array $options',
            '     * @return Result|false',
            '     */',
            '    public function find(',
            '        ?string $id,',
            '        array $options = ["fields" => ["name", "email"]],',
            '    ): Result|false {',
            '    }',
            '}'
        ].join('\n'));
    });

    test('inserts a PHPDoc block above a typed property', async function () {
        const source = '    private ?Domain\\Value $value;';
        const actual = await runCommand(source);

        assert.equal(actual, [
            '    /**',
            '     * value',
            '     *',
            '     * @var ?Domain\\Value',
            '     */',
            source
        ].join('\n'));
    });
});
