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
    var parts = /(class)\s+([\w_-]+)/.exec(selectedText);
    return parts[2];
}

/**
 * @param {string} paramName
 */
function getComment(paramName) {
    var textToInsert =  '/**\n * ' + paramName;
    textToInsert = textToInsert + '\n */';

    return textToInsert;
}
