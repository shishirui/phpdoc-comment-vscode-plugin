# phpdoc-comment-vscode-plugin

This plugin helps you to add phpdoc @param and @return tag for selected function signatures in vscode.

## Using

In a PHP file, select a function signature, ideally one that contains one or more parameters. Select the whole function signature then invoke the Add PHPDoc Comments extension (open the command palette (F1) and look for the command 'Add PHPDoc Comment'. Hit enter.)

![preview](https://raw.githubusercontent.com/shishirui/phpdoc-comment-vscode-plugin/master/images/preview.gif)

The extension will parse the selected signature and add @param and @return tags for each parameter and any return type in the selected signature, directly above the signature.

## Limitations

The extension does not support any other type tags. It only calculates @param and @return.

Parameter types are not inferred based on usage. If a type is not specified, empty braces `mixed` are returned.

**Enjoy!**
