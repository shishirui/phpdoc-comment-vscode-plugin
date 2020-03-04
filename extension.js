const vscode = require('vscode');
var method = require('./src/method');
var variable = require('./src/variable');
var classx = require('./src/class');

/**
 * @param {{ subscriptions: import("vscode").Disposable[]; }} context
 */
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.addPHPComment', function () {
        var lang = vscode.window.activeTextEditor.document.languageId;
        if (lang == "php") {
            var selection = vscode.window.activeTextEditor.selection;
            var startLine = selection.start.line;
            var selectedText = vscode.window.activeTextEditor.document.lineAt(startLine).text;

            var textToInsert = '';
            if (/function\s+([\w_-]+)/.exec(selectedText) != null) {
                textToInsert = method.comment(selectedText);
            } else if (/(public|private|protected|var)\s+\$([\w_-]+)/.exec(selectedText) != null) {
                textToInsert = variable.comment(selectedText);
            } else if (/(class)\s+([\w_-]+)/.exec(selectedText) != null) {
                textToInsert = classx.comment(selectedText);
            } else {
                vscode.window.showInformationMessage('Please select a PHP signature');
                return;
            }

            vscode.window.activeTextEditor.edit(function (editBuilder) {
                startLine--;
                if (startLine < 0) {
                    startLine = 0;
                    textToInsert = textToInsert + '\n';
                }

                var lastCharIndex = vscode.window.activeTextEditor.document.lineAt(startLine).text.length;
                var pos;

                if ((lastCharIndex > 0) && (startLine != 0)) {
                    pos = new vscode.Position(startLine, lastCharIndex);
                } else {
                    pos = new vscode.Position(startLine, 0);
                }

                textToInsert = '\n' + textToInsert;

                var line = vscode.window.activeTextEditor.document.lineAt(selection.start.line).text;
                var firstNonWhiteSpace = vscode.window.activeTextEditor.document.lineAt(selection.start.line).firstNonWhitespaceCharacterIndex;
                var stringToIndent = '';
                for (var i = 0; i < firstNonWhiteSpace; i++) {
                    if (line.charAt(i) == '\t') {
                        stringToIndent = stringToIndent + '\t';
                    } else if (line.charAt(i) == ' ') {
                        stringToIndent = stringToIndent + ' ';
                    }
                }
                textToInsert = textToInsert.replace(/^/gm, stringToIndent);
                editBuilder.insert(pos, textToInsert);
            }).then(function () {
            });
        }
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;