var util = require('./util');

/**
 * @param {string} selectedText
 */
function comment(selectedText) {
    selectedText = util.stripComments(selectedText);
    var className = getClassName(selectedText);
    return getComment(className);
}
exports.comment = comment;

/**
 * @param {string} selectedText
 */
function getClassName(selectedText) {
    var parts = /\b(?:class|interface|trait|enum)\s+(?!extends\b|implements\b)([a-zA-Z_][a-zA-Z0-9_]*)/i.exec(selectedText);
    return parts === null ? '' : parts[1];
}

/**
 * @param {string} paramName
 */
function getComment(paramName) {
    var textToInsert =  '/**\n * ' + paramName;
    textToInsert = textToInsert + '\n */';

    return textToInsert;
}
