const vscode = require('vscode');
var method = require('./src/method');
var variable = require('./src/variable');
var classx = require('./src/class');
var editorUtil = require('./src/editor');
var signature = require('./src/signature');

/**
 * @param {{ subscriptions: import("vscode").Disposable[]; }} context
 */
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.addPHPComment', async function () {
        var editor = vscode.window.activeTextEditor;
        if (editor === undefined || editor.document.languageId !== 'php') {
            vscode.window.showInformationMessage('Open a PHP file to add a PHPDoc comment');
            return;
        }

        var selection = editor.selection;
        var startLine = selection.start.line;
        var lines = [];
        var endLine = Math.min(editor.document.lineCount, startLine + signature.MAX_DECLARATION_LINES);
        for (var lineIndex = startLine; lineIndex < endLine; lineIndex++) {
            lines.push(editor.document.lineAt(lineIndex).text);
        }
        var selectedText = signature.collectDeclaration(lines);
        var kind = signature.detectKind(selectedText);

        var textToInsert = '';
        if (kind === 'function') {
            textToInsert = method.comment(selectedText);
        } else if (kind === 'property') {
            textToInsert = variable.comment(selectedText);
        } else if (kind === 'class') {
            textToInsert = classx.comment(selectedText);
        }

        if (textToInsert === '') {
            vscode.window.showInformationMessage('Place the cursor on a PHP function, property, class, interface, trait, or enum declaration');
            return;
        }

        var insertionLine = editorUtil.findInsertionLine(editor.document, startLine);
        if (editorUtil.hasLeadingDocBlock(editor.document, insertionLine)) {
            vscode.window.showInformationMessage('A PHPDoc comment already exists for this declaration');
            return;
        }

        var sourceLine = editor.document.lineAt(insertionLine);
        var indentation = sourceLine.text.slice(0, sourceLine.firstNonWhitespaceCharacterIndex);
        textToInsert = textToInsert.replace(/^/gm, indentation) + '\n';
        var lineEnding = editor.document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
        textToInsert = textToInsert.replace(/\n/g, lineEnding);

        try {
            var editApplied = await editor.edit(function (editBuilder) {
                editBuilder.insert(new vscode.Position(insertionLine, 0), textToInsert);
            });
            if (!editApplied) {
                vscode.window.showErrorMessage('Unable to add the PHPDoc comment');
            }
        } catch (error) {
            var message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage('Unable to add the PHPDoc comment: ' + message);
        }
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;
