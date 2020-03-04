# phpdoc-comment-vscode-plugin

This plugin helps you to add phpdoc block automatically for function, variable and class in vscode.

## Using

In a PHP file, place your cursor on the first line of a function, variable or class, then invoke the Add PHPDoc Comments extension (open the command palette (F1) and look for the command 'Add PHPDoc Comment'). Hit enter. You can also hit the shortcut key `command + shift + i`  or context menu.

![preview](https://raw.githubusercontent.com/shishirui/phpdoc-comment-vscode-plugin/master/images/preview.gif)

## Limitations

Parameter types are not inferred based on usage. If a type is not specified, a `mixed` are returned.

**Enjoy!**