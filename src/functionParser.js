var paramDeclaration = (function () {
    function paramDeclaration(paramName, paramType) {
        this.paramName = paramName;
        this.paramType = paramType;
        this.paramName = paramName;
        this.paramType = paramType;
    }
    return paramDeclaration;
})();
exports.paramDeclaration = paramDeclaration;

function getFunctionName(text) {
    var matches = /function\s+([\w_-]+)/.exec(text);
    var functionName = matches[1];

    return functionName;
}
exports.getFunctionName = getFunctionName;

function getParameterText(paramList, returnText, functionName) {
    var textToInsert = "";
    textToInsert = textToInsert + '/**\n * ' + functionName + '\n *\n *';

    paramList.forEach(function (element) {
        if (element.paramName != '') {
            textToInsert = textToInsert + ' @param  ';
            textToInsert = textToInsert + '' + element.paramType + '' + ' ';
            textToInsert = textToInsert + element.paramName + '\n' + ' *';
        }
    });

    if (paramList.length > 0) {
        textToInsert = textToInsert + '\n *';
    }

    if (returnText == '') {
        returnText = 'void';
    }

    textToInsert = textToInsert + ' @return ' + returnText + '\n' + ' */';

    return textToInsert;
}
exports.getParameterText = getParameterText;

function getReturns(text) {
    var returnText = '';
    text = text.replace(/\s/g, '');
    var lastIndex = text.lastIndexOf(':');
    var lastBrace = text.lastIndexOf(')');
    if (lastIndex > lastBrace) {
        //we have a return type
        //read to end of string
        var index = lastIndex + 1;
        var splicedText = text.slice(index, text.length);
        returnText = splicedText.match(/[a-zA-Z][a-zA-Z0-9$_\\]*/).toString();
    }
    return returnText;
}
exports.getReturns = getReturns;

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

function getParameters(text) {
    var paramList = [];
    text = text.replace(/\s/g, '');

    if (text.charAt(0) == '(') {            
        var keys = text.match(/\$[\w_-]+/g);
        for (const key in keys) {
            if (keys.hasOwnProperty(key)) {
                const name = keys[key];
                var type = "mixed";
                paramList.push(new paramDeclaration(name, type));
            }
        }
    }
    return paramList;
}
exports.getParameters = getParameters;