# phpdoc-comment-vscode-plugin

This extension adds PHPDoc blocks for PHP functions, properties, classes, interfaces, traits, and enums in VS Code.

## Using

In a PHP file, place your cursor on the first line of a declaration, then run **Add PHPDoc Comment** from the Command Palette (`F1`). You can also use `Cmd+Shift+I` on macOS, `Ctrl+Shift+I` on Windows/Linux, or the editor context menu.

The extension supports multiline function signatures, class and namespaced types, nullable types, union and intersection types, promoted constructor properties, variadic/reference parameters, typed properties, and nested default values.

![preview](https://raw.githubusercontent.com/shishirui/phpdoc-comment-vscode-plugin/master/images/preview.gif)

## Limitations

Parameter types are not inferred from usage. Parameters and properties without a declared or recognizable default type are documented as `mixed`.

**Enjoy!**
