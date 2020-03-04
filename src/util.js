/**
 * @param {string} text
 */
function stripComments(text) {
    var uncommentedText = '';
    var index = 0;
    while (index != text.length) {
        if ((text.charAt(index) == '/') && (text.charAt(index + 1) == '*')) {
            //parse comment
            if ((index + 2) != text.length) {
                index = index + 2;
                while ((text.charAt(index) != '*') && (text.charAt(index + 1) != '/')) {
                    index++;
                }
            }
            index = index + 2;
        }
        else if ((text.charAt(index) == '/') && (text.charAt(index + 1) == '/')) {
            //read to end of line
            while ((text.charAt(index) != '\n') && (index < text.length)) {
                index++;
            }
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