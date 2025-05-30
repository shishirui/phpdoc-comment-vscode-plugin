const vscode = require("vscode");
var method = require("./src/method");
var variable = require("./src/variable");
var classx = require("./src/class");

/**
 * Activate the extension
 * @param {import('vscode').ExtensionContext} context
 */

// Helper to find PHPDoc block above
async function findPhpDocBlockAbove(line) {
  let doc = editor.document;
  let phpdocStart = -1,
    phpdocEnd = -1;
  for (let i = line - 1; i >= 0; i--) {
    let text = doc.lineAt(i).text.trim();
    if (text.match(/^\*\//)) {
      phpdocEnd = i;
    }
    if (text.match(/^\/\*\*/)) {
      phpdocStart = i;
      break;
    }
    if (text && !text.startsWith("*") && !text.startsWith("/")) {
      break; // hit code, not a docblock
    }
  }
  if (phpdocStart !== -1 && phpdocEnd !== -1 && phpdocStart < phpdocEnd) {
    return { start: phpdocStart, end: phpdocEnd };
  }
  return null;
}

// Helper to update @param, @return, @var in an existing PHPDoc
function updatePhpDocBlock(
  oldBlockLines,
  params,
  returnType,
  variableType,
  isClass,
  className
) {
  let newLines = [];
  let paramInserted = false;
  let returnInserted = false;
  let varInserted = false;
  let summaryInserted = false;
  for (let line of oldBlockLines) {
    if (line.match(/@param/)) {
      if (!paramInserted && params && params.length > 0) {
        for (let p of params) {
          newLines.push(` * @param  ${p.paramType} ${p.paramName}`);
        }
        paramInserted = true;
      }
      continue;
    } else if (line.match(/@return/)) {
      if (!returnInserted && typeof returnType === "string") {
        newLines.push(` * @return ${returnType}`);
        returnInserted = true;
      }
      continue;
    } else if (line.match(/@var/)) {
      if (!varInserted && typeof variableType === "string") {
        newLines.push(` * @var ${variableType}`);
        varInserted = true;
      }
      continue;
    } else if (isClass && !summaryInserted && line.match(/^ \* [^@]/)) {
      // For class, update summary line
      newLines.push(` * ${className}`);
      summaryInserted = true;
      continue;
    }
    newLines.push(line);
  }
  // Insert missing tags if not present
  if (
    params &&
    params.length > 0 &&
    !oldBlockLines.some((l) => l.match(/@param/))
  ) {
    let idx = 1; // after summary
    for (let p of params) {
      newLines.splice(idx++, 0, ` * @param  ${p.paramType} ${p.paramName}`);
    }
  }
  if (
    typeof returnType === "string" &&
    !oldBlockLines.some((l) => l.match(/@return/))
  ) {
    let idx = newLines.length - 1;
    newLines.splice(idx, 0, ` * @return ${returnType}`);
  }
  if (
    typeof variableType === "string" &&
    !oldBlockLines.some((l) => l.match(/@var/))
  ) {
    let idx = newLines.length - 1;
    newLines.splice(idx, 0, ` * @var ${variableType}`);
  }
  return newLines;
}

// Helper to extract settings from function body
function extractSettingsFromFunction(document, startLine) {
  let settings = [];
  let openBraces = 0;
  let inFunction = false;
  let lineCount = document.lineCount;
  let funcStart = startLine;
  // Find function start (line with {)
  while (
    funcStart < lineCount &&
    !document.lineAt(funcStart).text.includes("{")
  ) {
    funcStart++;
  }
  if (funcStart >= lineCount) return [];
  let inBlockComment = false;
  for (let i = funcStart; i < lineCount; i++) {
    let line = document.lineAt(i).text;
    let trimmed = line.trim();
    // Handle block comments
    if (trimmed.startsWith("/*")) inBlockComment = true;
    if (inBlockComment) {
      if (trimmed.endsWith("*/") || trimmed.includes("*/"))
        inBlockComment = false;
      continue;
    }
    // Skip single-line comments
    if (trimmed.startsWith("//")) continue;
    if (line.includes("{")) openBraces++;
    if (line.includes("}")) openBraces--;
    if (openBraces > 0) inFunction = true;
    if (inFunction) {
      let regex = /getSettings\(["']([^"']+)["']\)/g;
      let match;
      while ((match = regex.exec(line)) !== null) {
        settings.push(match[1].trim());
      }
    }
    if (inFunction && openBraces === 0) break;
  }
  // Remove duplicates
  return [...new Set(settings)];
}

// Helper to update or insert @settings block in PHPDoc
function updateSettingsInPhpDocBlock(oldBlockLines, settings) {
  let newLines = [];
  let inSettings = false;
  let settingsInserted = false;
  for (let line of oldBlockLines) {
    if (line.match(/@settings/)) {
      inSettings = true;
      if (!settingsInserted && settings.length > 0) {
        newLines.push(" * @settings");
        for (let s of settings) {
          newLines.push(` *  - ${s}`);
        }
        settingsInserted = true;
      }
      // If settings is empty, skip the @settings line and all its values
      if (settings.length === 0) {
        continue;
      }
      continue;
    }
    // Remove all old settings lines (even if not in new settings)
    if (inSettings && (line.match(/^ \*  - /) || line.trim() === "*")) {
      continue;
    } else if (inSettings) {
      inSettings = false;
    }
    newLines.push(line);
  }
  // If no @settings, add before end
  if (!oldBlockLines.some((l) => l.match(/@settings/)) && settings.length > 0) {
    let idx = newLines.length - 1;
    newLines.splice(idx, 0, " * @settings");
    for (let s of settings) {
      newLines.splice(idx + 1, 0, ` *  - ${s}`);
      idx++;
    }
  }
  return newLines;
}

// Remove inner 'called' PHPDoc blocks inside functions/classes
function removeInnerCalledPhpDoc(editor, document) {
  const edit = new vscode.WorkspaceEdit();
  const lineCount = document.lineCount;
  let inBlock = false;
  let blockStart = -1;
  let blockEnd = -1;
  for (let i = 0; i < lineCount; i++) {
    const line = document.lineAt(i).text;
    if (line.match(/^\s*\/\*\*/)) {
      // Potential start of a PHPDoc block
      blockStart = i;
      inBlock = true;
    }
    if (inBlock && line.match(/^\s*\*\/\s*$/)) {
      blockEnd = i;
      // Check if this block contains 'called' in the summary
      let blockLines = [];
      for (let j = blockStart; j <= blockEnd; j++) {
        blockLines.push(document.lineAt(j).text);
      }
      if (blockLines.some((l) => l.match(/\*\s*called/))) {
        // Remove the block
        edit.delete(
          document.uri,
          new vscode.Range(blockStart, 0, blockEnd + 1, 0)
        );
      }
      inBlock = false;
      blockStart = -1;
      blockEnd = -1;
    }
  }
  return vscode.workspace.applyEdit(edit);
}

function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "extension.addPHPComment",
    async function () {
      var lang = vscode.window.activeTextEditor.document.languageId;
      if (lang == "php") {
        var editor = vscode.window.activeTextEditor;
        var selection = editor.selection;
        var startLine = selection.start.line;
        var selectedText = editor.document.lineAt(startLine).text;

        let phpdoc = await findPhpDocBlockAbove(startLine);
        let editDone = false;
        if (/function\s+([\w_-]+)/.exec(selectedText) != null) {
          // Function
          let firstBraceIndex = selectedText.indexOf("(");
          let paramList = require("./src/method").getParameters(
            selectedText.slice(firstBraceIndex)
          );
          let returnText = require("./src/method").getReturns(selectedText);
          if (!returnText) returnText = "void";
          // Extract settings from function body
          let settings = extractSettingsFromFunction(
            editor.document,
            startLine
          );
          if (phpdoc) {
            // Read old block
            let oldBlockLines = [];
            for (let i = phpdoc.start; i <= phpdoc.end; i++) {
              oldBlockLines.push(editor.document.lineAt(i).text);
            }
            let updatedBlock = updatePhpDocBlock(
              oldBlockLines,
              paramList,
              returnText
            );
            // Add/update @settings
            updatedBlock = updateSettingsInPhpDocBlock(updatedBlock, settings);
            await editor.edit((editBuilder) => {
              let range = new vscode.Range(
                phpdoc.start,
                0,
                phpdoc.end,
                editor.document.lineAt(phpdoc.end).text.length
              );
              editBuilder.replace(range, updatedBlock.join("\n"));
            });
            editDone = true;
          } else {
            textToInsert = require("./src/method").comment(selectedText);
            // Add @settings if needed
            if (settings.length > 0) {
              let lines = textToInsert.split("\n");
              let idx = lines.length - 1;
              lines.splice(idx, 0, " * @settings");
              for (let s of settings) {
                lines.splice(idx + 1, 0, ` *  - ${s}`);
                idx++;
              }
              textToInsert = lines.join("\n");
            }
          }
        } else if (
          /(public|private|protected|var)\s+\$([\w_-]+)/.exec(selectedText) !=
          null
        ) {
          // Variable
          let type = require("./src/variable").getType(selectedText);
          if (phpdoc) {
            let oldBlockLines = [];
            for (let i = phpdoc.start; i <= phpdoc.end; i++) {
              oldBlockLines.push(editor.document.lineAt(i).text);
            }
            let updatedBlock = updatePhpDocBlock(
              oldBlockLines,
              null,
              null,
              type
            );
            await editor.edit((editBuilder) => {
              let range = new vscode.Range(
                phpdoc.start,
                0,
                phpdoc.end,
                editor.document.lineAt(phpdoc.end).text.length
              );
              editBuilder.replace(range, updatedBlock.join("\n"));
            });
            editDone = true;
          } else {
            textToInsert = require("./src/variable").comment(selectedText);
          }
        } else if (/(class)\s+([\w_-]+)/.exec(selectedText) != null) {
          // Class
          let className = require("./src/class").getClassName(selectedText);
          if (phpdoc) {
            let oldBlockLines = [];
            for (let i = phpdoc.start; i <= phpdoc.end; i++) {
              oldBlockLines.push(editor.document.lineAt(i).text);
            }
            let updatedBlock = updatePhpDocBlock(
              oldBlockLines,
              null,
              null,
              null,
              true,
              className
            );
            await editor.edit((editBuilder) => {
              let range = new vscode.Range(
                phpdoc.start,
                0,
                phpdoc.end,
                editor.document.lineAt(phpdoc.end).text.length
              );
              editBuilder.replace(range, updatedBlock.join("\n"));
            });
            editDone = true;
          } else {
            textToInsert = require("./src/class").comment(selectedText);
          }
        } else {
          vscode.window.showInformationMessage("Please select a PHP signature");
          return;
        }

        if (!editDone && textToInsert) {
          editor
            .edit(function (editBuilder) {
              startLine--;
              if (startLine < 0) {
                startLine = 0;
                textToInsert = textToInsert + "\n";
              }

              var lastCharIndex = editor.document.lineAt(startLine).text.length;
              var pos;

              if (lastCharIndex > 0 && startLine != 0) {
                pos = new vscode.Position(startLine, lastCharIndex);
              } else {
                pos = new vscode.Position(startLine, 0);
              }

              textToInsert = "\n" + textToInsert;

              var line = editor.document.lineAt(selection.start.line).text;
              var firstNonWhiteSpace = editor.document.lineAt(
                selection.start.line
              ).firstNonWhitespaceCharacterIndex;
              var stringToIndent = "";
              for (var i = 0; i < firstNonWhiteSpace; i++) {
                if (line.charAt(i) == "\t") {
                  stringToIndent = stringToIndent + "\t";
                } else if (line.charAt(i) == " ") {
                  stringToIndent = stringToIndent + " ";
                }
              }
              textToInsert = textToInsert.replace(/^/gm, stringToIndent);
              editBuilder.insert(pos, textToInsert);
            })
            .then(function () {});
        }
      }
    }
  );

  // New command: Add PHPDoc for entire file
  let disposableFile = vscode.commands.registerCommand(
    "extension.addPHPDocForFile",
    async function () {
      var lang = vscode.window.activeTextEditor.document.languageId;
      if (lang == "php") {
        var editor = vscode.window.activeTextEditor;
        var document = editor.document;
        var lineCount = document.lineCount;
        // Remove all inner 'called' PHPDoc blocks first
        await removeInnerCalledPhpDoc(editor, document);
        let targets = [];
        for (let i = 0; i < lineCount; i++) {
          let text = document.lineAt(i).text;
          if (
            /function\s+([\w_-]+)/.exec(text) != null ||
            /(public|private|protected|var)\s+\$([\w_-]+)/.exec(text) != null ||
            /(class)\s+([\w_-]+)/.exec(text) != null
          ) {
            targets.push(i);
          }
        }
        for (let idx = targets.length - 1; idx >= 0; idx--) {
          let startLine = targets[idx];
          let selectedText = document.lineAt(startLine).text;
          let phpdoc = await (async function findPhpDocBlockAbove(line) {
            let phpdocStart = -1,
              phpdocEnd = -1;
            for (let i = line - 1; i >= 0; i--) {
              let text = document.lineAt(i).text.trim();
              if (text.match(/^[*]\//)) phpdocEnd = i;
              if (text.match(/^\/\*\*/)) {
                phpdocStart = i;
                break;
              }
              if (text && !text.startsWith("*") && !text.startsWith("/")) break;
            }
            if (
              phpdocStart !== -1 &&
              phpdocEnd !== -1 &&
              phpdocStart < phpdocEnd
            ) {
              return { start: phpdocStart, end: phpdocEnd };
            }
            return null;
          })(startLine);

          let textToInsert = "";
          let editDone = false;
          if (/function\s+([\w_-]+)/.exec(selectedText) != null) {
            let firstBraceIndex = selectedText.indexOf("(");
            let paramList = require("./src/method").getParameters(
              selectedText.slice(firstBraceIndex)
            );
            let returnText = require("./src/method").getReturns(selectedText);
            if (!returnText) returnText = "void";
            let settings = extractSettingsFromFunction(document, startLine);
            if (phpdoc) {
              let oldBlockLines = [];
              for (let i = phpdoc.start; i <= phpdoc.end; i++) {
                oldBlockLines.push(document.lineAt(i).text);
              }
              let updatedBlock = updatePhpDocBlock(
                oldBlockLines,
                paramList,
                returnText
              );
              updatedBlock = updateSettingsInPhpDocBlock(
                updatedBlock,
                settings
              );
              await editor.edit((editBuilder) => {
                let range = new vscode.Range(
                  phpdoc.start,
                  0,
                  phpdoc.end,
                  document.lineAt(phpdoc.end).text.length
                );
                editBuilder.replace(range, updatedBlock.join("\n"));
              });
              editDone = true;
            } else {
              textToInsert = require("./src/method").comment(selectedText);
              if (settings.length > 0) {
                let lines = textToInsert.split("\n");
                let idx2 = lines.length - 1;
                lines.splice(idx2, 0, " * @settings");
                for (let s of settings) {
                  lines.splice(idx2 + 1, 0, ` *  - ${s}`);
                  idx2++;
                }
                textToInsert = lines.join("\n");
              }
            }
          } else if (
            /(public|private|protected|var)\s+\$([\w_-]+)/.exec(selectedText) !=
            null
          ) {
            let type = require("./src/variable").getType(selectedText);
            if (phpdoc) {
              let oldBlockLines = [];
              for (let i = phpdoc.start; i <= phpdoc.end; i++) {
                oldBlockLines.push(document.lineAt(i).text);
              }
              let updatedBlock = updatePhpDocBlock(
                oldBlockLines,
                null,
                null,
                type
              );
              await editor.edit((editBuilder) => {
                let range = new vscode.Range(
                  phpdoc.start,
                  0,
                  phpdoc.end,
                  document.lineAt(phpdoc.end).text.length
                );
                editBuilder.replace(range, updatedBlock.join("\n"));
              });
              editDone = true;
            } else {
              textToInsert = require("./src/variable").comment(selectedText);
            }
          } else if (/(class)\s+([\w_-]+)/.exec(selectedText) != null) {
            let className = require("./src/class").getClassName(selectedText);
            if (phpdoc) {
              let oldBlockLines = [];
              for (let i = phpdoc.start; i <= phpdoc.end; i++) {
                oldBlockLines.push(document.lineAt(i).text);
              }
              let updatedBlock = updatePhpDocBlock(
                oldBlockLines,
                null,
                null,
                null,
                true,
                className
              );
              await editor.edit((editBuilder) => {
                let range = new vscode.Range(
                  phpdoc.start,
                  0,
                  phpdoc.end,
                  document.lineAt(phpdoc.end).text.length
                );
                editBuilder.replace(range, updatedBlock.join("\n"));
              });
              editDone = true;
            } else {
              textToInsert = require("./src/class").comment(selectedText);
            }
          }
          if (!editDone && textToInsert && textToInsert.length > 0) {
            await editor.edit(function (editBuilder) {
              let insertLine = startLine - 1;
              if (insertLine < 0) {
                insertLine = 0;
                textToInsert = textToInsert + "\n";
              }
              var lastCharIndex = document.lineAt(insertLine).text.length;
              var pos;
              if (lastCharIndex > 0 && insertLine != 0) {
                pos = new vscode.Position(insertLine, lastCharIndex);
              } else {
                pos = new vscode.Position(insertLine, 0);
              }
              textToInsert = "\n" + textToInsert;
              var line = document.lineAt(startLine).text;
              var firstNonWhiteSpace =
                document.lineAt(startLine).firstNonWhitespaceCharacterIndex;
              var stringToIndent = "";
              for (var i = 0; i < firstNonWhiteSpace; i++) {
                if (line.charAt(i) == "\t") {
                  stringToIndent = stringToIndent + "\t";
                } else if (line.charAt(i) == " ") {
                  stringToIndent = stringToIndent + " ";
                }
              }
              textToInsert = textToInsert.replace(/^/gm, stringToIndent);
              editBuilder.insert(pos, textToInsert);
            });
          }
        }
      }
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposableFile);
}
exports.activate = activate;
