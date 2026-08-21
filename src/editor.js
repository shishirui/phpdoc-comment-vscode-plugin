var MAX_LOOKBACK_LINES = 80;

/**
 * @param {string} text
 * @param {RegExp} pattern
 */
function countMatches(text, pattern) {
    var matches = text.match(pattern);
    return matches === null ? 0 : matches.length;
}

/**
 * Find the first line of PHP attributes attached to a declaration.
 *
 * @param {{ lineAt(line: number): { text: string } }} document
 * @param {number} declarationLine
 */
function findInsertionLine(document, declarationLine) {
    var candidateLine = declarationLine;
    var bracketDepth = 0;
    var foundAttribute = false;
    var minimumLine = Math.max(0, declarationLine - MAX_LOOKBACK_LINES);

    for (var lineIndex = declarationLine - 1; lineIndex >= minimumLine; lineIndex--) {
        var text = document.lineAt(lineIndex).text;
        var openBrackets = countMatches(text, /\[/g);
        var closeBrackets = countMatches(text, /\]/g);
        var startsAttribute = text.indexOf('#[') !== -1;

        if (bracketDepth > 0 || startsAttribute || closeBrackets > openBrackets) {
            bracketDepth += closeBrackets - openBrackets;
            candidateLine = lineIndex;
            foundAttribute = foundAttribute || startsAttribute;

            if (bracketDepth < 0) {
                return declarationLine;
            }
            continue;
        }

        break;
    }

    return foundAttribute && bracketDepth === 0 ? candidateLine : declarationLine;
}

/**
 * @param {{ lineAt(line: number): { text: string } }} document
 * @param {number} insertionLine
 */
function hasLeadingDocBlock(document, insertionLine) {
    if (insertionLine === 0) {
        return false;
    }

    var lineIndex = insertionLine - 1;
    if (!document.lineAt(lineIndex).text.trim().endsWith('*/')) {
        return false;
    }

    var minimumLine = Math.max(0, insertionLine - MAX_LOOKBACK_LINES);
    for (; lineIndex >= minimumLine; lineIndex--) {
        var text = document.lineAt(lineIndex).text;
        if (text.indexOf('/**') !== -1) {
            return true;
        }
        if (text.indexOf('/*') !== -1) {
            return false;
        }
    }

    return false;
}

exports.findInsertionLine = findInsertionLine;
exports.hasLeadingDocBlock = hasLeadingDocBlock;
