/**
 * @param {string} text
 */
function stripComments(text) {
    var uncommentedText = '';
    var index = 0;
    while (index < text.length) {
        if ((text.charAt(index) == '/') && (text.charAt(index + 1) == '*')) {
            var commentEnd = text.indexOf('*/', index + 2);
            if (commentEnd == -1) {
                break;
            }

            index = commentEnd + 2;
        }
        else if ((text.charAt(index) == '/') && (text.charAt(index + 1) == '/')) {
            //read to end of line
            var lineEnd = text.indexOf('\n', index + 2);
            if (lineEnd == -1) {
                break;
            }

            index = lineEnd;
        }
        else {
            uncommentedText = uncommentedText + text.charAt(index);
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
    if (/^['"]/.exec(value) != null) {
        return 'string';
    } else if (/^\d+$/.exec(value) != null) {
        return 'int';
    } else if (/^\d+\.\d+$/.exec(value) != null) {
        return 'float';
    } else if (/^(true|false)$/i.exec(value) != null) {
        return 'bool';
    } else if (/^(array\(|\[)/i.exec(value) != null) {
        return 'array';
    }
}
exports.typeWithValue = typeWithValue;
