var util = require('./util');

/**
 * @param {string} selectedText
 */
function comment(selectedText) {
    selectedText = util.stripComments(selectedText);
    var varName = getVarName(selectedText);
    var type = getType(selectedText);
    return getComment(varName, type);
}
exports.comment = comment;

/**
 * @param {string} selectedText
 */
function getVarName(selectedText) {
    var parts = /(public|private|protected|var)\s+\$([\w_-]+)/.exec(selectedText);
    return parts[2];
}

/**
 * @param {string} selectedText
 */
function getType(selectedText) {
    var type = 'mixed';
    var parts = /=\s?(.+)/.exec(selectedText);
    if (parts != null) {
        var value = parts[1].replace(/[\r\n;,]$/, '');
        type = util.typeWithValue(value);
    }

    return type;
}

/**
 * @param {string} paramName
 * @param {string} type
 */
function getComment(paramName, type) {
    var textToInsert =  '/**\n * ' + paramName + '\n *\n *';
    textToInsert = textToInsert + ' @var ' + type;
    textToInsert = textToInsert + '\n */';

    return textToInsert;
}
