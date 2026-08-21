var signature = require('./signature');

/**
 * @param {{ paramName: string; paramType: string }[]} paramList
 * @param {string} returnText
 * @param {string} functionName
 */
function getComment(paramList, returnText, functionName) {
    var textToInsert = "";
    textToInsert = textToInsert + '/**\n * ' + functionName + '\n *\n *';

    paramList.forEach(function (element) {
        if (element.paramName != '') {
                textToInsert = textToInsert + ' @param ';
            textToInsert = textToInsert + '' + element.paramType + '' + ' ';
            textToInsert = textToInsert + element.paramName + '\n' + ' *';
        }
    });

    if (returnText == '') {
        returnText = 'void';
    }

    textToInsert = textToInsert + ' @return ' + returnText + '\n' + ' */';

    return textToInsert;
}

/**
 * @param {string} selectedText
 */
function comment(selectedText) {
    var parsedFunction = signature.parseFunction(selectedText);
    if (parsedFunction === null) {
        return '';
    }

    return getComment(parsedFunction.parameters, parsedFunction.returnType, parsedFunction.name);
}
exports.comment = comment;
