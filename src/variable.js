var signature = require('./signature');

/**
 * @param {string} selectedText
 */
function comment(selectedText) {
    var property = signature.parseProperty(selectedText);
    if (property === null) {
        return '';
    }
    return getComment(property.name, property.type);
}
exports.comment = comment;

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
