const vscode = require('vscode');
var functionParser = require('./src/functionParser');
var indentString = require('indent-string');

function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.addComment', function () {
        var lang = vscode.window.activeTextEditor.document.languageId;

        if (lang == "php") {
            var selection = vscode.window.activeTextEditor.selection;
            var startLine = selection.start.line;
            var selectedText = vscode.window.activeTextEditor.document.lineAt(startLine).text;
            var outputMessage = 'Please select a PHP function signature';

            if (/function\s+([\w_-]+)/.exec(selectedText) == null) {
                vscode.window.showInformationMessage(outputMessage);
                return;
            }

            var fullLine = selectedText;
            var firstBraceIndex = selectedText.indexOf('(');
            selectedText = selectedText.slice(firstBraceIndex);
            selectedText = functionParser.stripComments(selectedText);
            var returnText = functionParser.getReturns(selectedText);
            var params = functionParser.getParameters(selectedText);
            var functionName = functionParser.getFunctionName(fullLine);
            var textToInsert = functionParser.getParameterText(params, returnText, functionName);
            startLine--;

            vscode.window.activeTextEditor.edit(function (editBuilder) {
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
                textToInsert = indentString(textToInsert, stringToIndent, 1);
                editBuilder.insert(pos, textToInsert);
            }).then(function () {
            });
        }
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;