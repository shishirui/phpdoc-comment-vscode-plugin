/**
 * @param {string} text
 */
function stripComments(text) {
    var uncommentedText = '';
    var state = 'code';
    var index = 0;

    while (index < text.length) {
        var character = text.charAt(index);
        var nextCharacter = text.charAt(index + 1);

        if (state === 'block-comment') {
            if (character === '*' && nextCharacter === '/') {
                state = 'code';
                index += 2;
            } else {
                if (character === '\n') {
                    uncommentedText += '\n';
                }
                index++;
            }
            continue;
        }

        if (state === 'line-comment') {
            if (character === '\n') {
                uncommentedText += '\n';
                state = 'code';
            }
            index++;
            continue;
        }

        if (state === 'single-quote' || state === 'double-quote') {
            uncommentedText += character;
            if (character === '\\' && index + 1 < text.length) {
                uncommentedText += nextCharacter;
                index += 2;
                continue;
            }
            if ((state === 'single-quote' && character === "'") ||
                (state === 'double-quote' && character === '"')) {
                state = 'code';
            }
            index++;
            continue;
        }

        if (character === '/' && nextCharacter === '*') {
            state = 'block-comment';
            index += 2;
        } else if (character === '/' && nextCharacter === '/') {
            state = 'line-comment';
            index += 2;
        } else if (character === '#' && nextCharacter !== '[') {
            state = 'line-comment';
            index++;
        } else {
            uncommentedText += character;
            if (character === "'") {
                state = 'single-quote';
            } else if (character === '"') {
                state = 'double-quote';
            }
            index++;
        }
    }

    return uncommentedText;
}
exports.stripComments = stripComments;

/**
 * @param {string} value
 */
function typeWithValue(value) {
    value = value.trim();
    if (/^['"]/.exec(value) != null) {
        return 'string';
    } else if (/^[+-]?(?:0[xX][\da-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d[\d_]*)$/.exec(value) != null) {
        return 'int';
    } else if (/^[+-]?(?:\d[\d_]*\.\d[\d_]*(?:[eE][+-]?\d+)?|\d[\d_]*[eE][+-]?\d+)$/.exec(value) != null) {
        return 'float';
    } else if (/^(true|false)$/i.exec(value) != null) {
        return 'bool';
    } else if (/^(array\(|\[)/i.exec(value) != null) {
        return 'array';
    } else if (/^null$/i.exec(value) != null) {
        return 'null';
    } else if (/^(?:static\s+)?(?:fn|function)\b/i.exec(value) != null) {
        return '\\Closure';
    } else {
        var classMatch = /^new\s+([\\a-zA-Z_][\\a-zA-Z0-9_]*)/i.exec(value);
        if (classMatch !== null) {
            return classMatch[1];
        }
    }

    return 'mixed';
}
exports.typeWithValue = typeWithValue;
