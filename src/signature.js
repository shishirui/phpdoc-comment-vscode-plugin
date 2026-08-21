var util = require('./util');

var MAX_DECLARATION_LINES = 80;
var MAX_DECLARATION_CHARACTERS = 20000;

/**
 * @param {string} text
 * @param {number} openIndex
 * @param {string} openCharacter
 * @param {string} closeCharacter
 */
function findMatchingDelimiter(text, openIndex, openCharacter, closeCharacter) {
    var depth = 0;
    var quote = '';

    for (var index = openIndex; index < text.length; index++) {
        var character = text.charAt(index);

        if (quote !== '') {
            if (character === '\\') {
                index++;
            } else if (character === quote) {
                quote = '';
            }
            continue;
        }

        if (character === "'" || character === '"') {
            quote = character;
        } else if (character === openCharacter) {
            depth++;
        } else if (character === closeCharacter) {
            depth--;
            if (depth === 0) {
                return index;
            }
        }
    }

    return -1;
}

/**
 * @param {string} text
 */
function normalizeType(text) {
    return text
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s*([|&?()])\s*/g, '$1');
}

/**
 * @param {string} text
 */
function splitTopLevel(text) {
    var parts = [];
    var start = 0;
    var roundDepth = 0;
    var squareDepth = 0;
    var curlyDepth = 0;
    var quote = '';

    for (var index = 0; index < text.length; index++) {
        var character = text.charAt(index);

        if (quote !== '') {
            if (character === '\\') {
                index++;
            } else if (character === quote) {
                quote = '';
            }
            continue;
        }

        if (character === "'" || character === '"') {
            quote = character;
        } else if (character === '(') {
            roundDepth++;
        } else if (character === ')') {
            roundDepth = Math.max(0, roundDepth - 1);
        } else if (character === '[') {
            squareDepth++;
        } else if (character === ']') {
            squareDepth = Math.max(0, squareDepth - 1);
        } else if (character === '{') {
            curlyDepth++;
        } else if (character === '}') {
            curlyDepth = Math.max(0, curlyDepth - 1);
        } else if (character === ',' && roundDepth === 0 && squareDepth === 0 && curlyDepth === 0) {
            parts.push(text.slice(start, index));
            start = index + 1;
        }
    }

    parts.push(text.slice(start));
    return parts;
}

/**
 * @param {string} text
 */
function removeLeadingAttributes(text) {
    var result = text.trim();

    while (result.indexOf('#[') === 0) {
        var closeIndex = findMatchingDelimiter(result, 1, '[', ']');
        if (closeIndex === -1) {
            return '';
        }
        result = result.slice(closeIndex + 1).trim();
    }

    return result;
}

/**
 * @param {string} text
 */
function parseParameter(text) {
    var parameter = removeLeadingAttributes(text);
    var variableMatch = /\$[a-zA-Z_][a-zA-Z0-9_]*/.exec(parameter);
    if (variableMatch === null) {
        return null;
    }

    var prefix = parameter.slice(0, variableMatch.index).trim();
    var modifierPattern = /^(?:(?:public|protected|private)(?:\s*\(\s*set\s*\))?|readonly|static|final)\s+/i;
    while (modifierPattern.test(prefix)) {
        prefix = prefix.replace(modifierPattern, '').trim();
    }

    prefix = prefix.replace(/(?:\.\.\.|&)\s*$/, '').trim();

    return {
        paramName: variableMatch[0],
        paramType: prefix === '' ? 'mixed' : normalizeType(prefix)
    };
}

/**
 * @param {string} text
 */
function findReturnTypeEnd(text) {
    var roundDepth = 0;
    var quote = '';

    for (var index = 0; index < text.length; index++) {
        var character = text.charAt(index);
        if (quote !== '') {
            if (character === '\\') {
                index++;
            } else if (character === quote) {
                quote = '';
            }
            continue;
        }

        if (character === "'" || character === '"') {
            quote = character;
        } else if (character === '(') {
            roundDepth++;
        } else if (character === ')') {
            roundDepth = Math.max(0, roundDepth - 1);
        } else if (roundDepth === 0 && (character === '{' || character === ';')) {
            return index;
        } else if (roundDepth === 0 && character === '=' && text.charAt(index + 1) === '>') {
            return index;
        }
    }

    return text.length;
}

/**
 * @param {string} text
 */
function parseFunction(text) {
    var cleanText = util.stripComments(text);
    var functionMatch = /\bfunction\s*&?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/i.exec(cleanText);
    if (functionMatch === null) {
        return null;
    }

    var openIndex = cleanText.indexOf('(', functionMatch.index);
    var closeIndex = findMatchingDelimiter(cleanText, openIndex, '(', ')');
    var parametersText = closeIndex === -1 ? cleanText.slice(openIndex + 1) : cleanText.slice(openIndex + 1, closeIndex);
    /** @type {{ paramName: string; paramType: string; }[]} */
    var parameters = [];

    splitTopLevel(parametersText).forEach(function (parameterText) {
        var parameter = parseParameter(parameterText);
        if (parameter !== null) {
            parameters.push(parameter);
        }
    });

    var returnType = '';
    if (closeIndex !== -1) {
        var tail = cleanText.slice(closeIndex + 1).trim();
        if (tail.charAt(0) === ':') {
            var returnText = tail.slice(1);
            returnType = normalizeType(returnText.slice(0, findReturnTypeEnd(returnText)));
        }
    }

    return {
        name: functionMatch[1],
        parameters: parameters,
        returnType: returnType
    };
}

/**
 * @param {string} text
 */
function removePropertyModifiers(text) {
    var result = removeLeadingAttributes(text);
    var modifierPattern = /^(?:(?:public|protected|private)(?:\s*\(\s*set\s*\))?|var|readonly|static|final|abstract)\s+/i;
    while (modifierPattern.test(result)) {
        result = result.replace(modifierPattern, '').trim();
    }
    return result;
}

/**
 * @param {string} text
 */
function parseProperty(text) {
    var cleanText = removePropertyModifiers(util.stripComments(text));
    var variableMatch = /\$([a-zA-Z_][a-zA-Z0-9_]*)/.exec(cleanText);
    if (variableMatch === null) {
        return null;
    }

    var declaredType = normalizeType(cleanText.slice(0, variableMatch.index));
    var remainder = cleanText.slice(variableMatch.index + variableMatch[0].length);
    var defaultMatch = /^\s*=\s*([\s\S]*?)(?:;|$)/.exec(remainder);
    var type = declaredType;
    if (type === '') {
        type = defaultMatch === null ? 'mixed' : util.typeWithValue(defaultMatch[1]);
    }

    return {
        name: variableMatch[1],
        type: type
    };
}

/**
 * @param {string} text
 */
function detectKind(text) {
    var cleanText = util.stripComments(text);
    if (/\bfunction\s*&?\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\(/i.test(cleanText)) {
        return 'function';
    }
    if (/\b(?:class|interface|trait|enum)\s+(?!extends\b|implements\b)[a-zA-Z_][a-zA-Z0-9_]*/i.test(cleanText)) {
        return 'class';
    }
    var propertyText = removeLeadingAttributes(cleanText);
    if (/^(?:(?:(?:public|protected|private)(?:\s*\(\s*set\s*\))?|var|readonly|static|final|abstract)\s+)+[\s\S]*\$[a-zA-Z_][a-zA-Z0-9_]*/i.test(propertyText)) {
        return 'property';
    }
    return '';
}

/**
 * @param {string} text
 */
function hasTopLevelTerminator(text) {
    var roundDepth = 0;
    var squareDepth = 0;
    var curlyDepth = 0;
    var quote = '';

    for (var index = 0; index < text.length; index++) {
        var character = text.charAt(index);
        if (quote !== '') {
            if (character === '\\') {
                index++;
            } else if (character === quote) {
                quote = '';
            }
            continue;
        }

        if (character === "'" || character === '"') {
            quote = character;
        } else if (character === '(') {
            roundDepth++;
        } else if (character === ')') {
            roundDepth = Math.max(0, roundDepth - 1);
        } else if (character === '[') {
            squareDepth++;
        } else if (character === ']') {
            squareDepth = Math.max(0, squareDepth - 1);
        } else if (character === '{') {
            if (roundDepth === 0 && squareDepth === 0 && curlyDepth === 0) {
                return true;
            }
            curlyDepth++;
        } else if (character === '}') {
            curlyDepth = Math.max(0, curlyDepth - 1);
        } else if (character === ';' && roundDepth === 0 && squareDepth === 0 && curlyDepth === 0) {
            return true;
        }
    }

    return false;
}

/**
 * @param {string} text
 * @param {string} nextLine
 */
function functionDeclarationIsComplete(text, nextLine) {
    var cleanText = util.stripComments(text);
    var functionMatch = /\bfunction\s*&?\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\(/i.exec(cleanText);
    if (functionMatch === null) {
        return false;
    }

    var openIndex = cleanText.indexOf('(', functionMatch.index);
    var closeIndex = findMatchingDelimiter(cleanText, openIndex, '(', ')');
    if (closeIndex === -1) {
        return false;
    }

    var tail = cleanText.slice(closeIndex + 1);
    if (hasTopLevelTerminator(tail)) {
        return true;
    }

    var trimmedTail = tail.trim();
    var trimmedNextLine = nextLine.trim();
    if (trimmedTail === '') {
        return !/^(:|\{|;|=>)/.test(trimmedNextLine);
    }

    if (trimmedTail.charAt(0) === ':') {
        var returnType = normalizeType(trimmedTail.slice(1));
        if (returnType === '' || /[|&?\\(]$/.test(returnType)) {
            return false;
        }
        return !/^(\||&|\{|;|=>)/.test(trimmedNextLine);
    }

    return true;
}

/**
 * @param {string[]} lines
 */
function collectDeclaration(lines) {
    var declaration = '';
    var limit = Math.min(lines.length, MAX_DECLARATION_LINES);

    for (var index = 0; index < limit; index++) {
        if (declaration.length > 0) {
            declaration += '\n';
        }
        declaration += lines[index];
        if (declaration.length >= MAX_DECLARATION_CHARACTERS) {
            return declaration.slice(0, MAX_DECLARATION_CHARACTERS);
        }

        var kind = detectKind(declaration);
        var nextLine = index + 1 < limit ? lines[index + 1] : '';
        if (kind === 'function' && functionDeclarationIsComplete(declaration, nextLine)) {
            return declaration;
        }
        if (kind === 'property' && hasTopLevelTerminator(util.stripComments(declaration))) {
            return declaration;
        }
        if (kind === 'class' && (/\{/.test(util.stripComments(declaration)) || index > 0 || nextLine.trim().charAt(0) !== '{')) {
            return declaration;
        }
    }

    return declaration;
}

exports.collectDeclaration = collectDeclaration;
exports.detectKind = detectKind;
exports.MAX_DECLARATION_LINES = MAX_DECLARATION_LINES;
exports.normalizeType = normalizeType;
exports.parseFunction = parseFunction;
exports.parseProperty = parseProperty;
exports.splitTopLevel = splitTopLevel;
