# Changelog

All notable changes to PHPDoc Comment will be documented in this file.

## 1.4.1 - Unreleased

### Fixed

- Avoid inserting a second PHPDoc block when one already exists.
- Insert PHPDoc before PHP attributes when the cursor is on the declaration line.
- Preserve the document's LF or CRLF line endings.
- Use conventional single-spacing in generated `@param` tags.

### Added

- Add Marketplace keywords, license, homepage, issue tracker, and additional categories.
- Add a security policy and scheduled dependency update configuration.

## 1.4.0 - 2026-08-21

### Added

- Support multiline function declarations and nested parameter default values.
- Preserve nullable, union, intersection, namespaced, class, and literal PHP types.
- Support typed properties, promoted constructor properties, references, and variadic parameters.
- Generate class-style comments for interfaces, traits, and enums.
- Add real VS Code command integration tests and JavaScript type checking to CI.

### Fixed

- Avoid errors when the command runs without an active PHP editor or on incomplete syntax.
- Preserve comment markers inside quoted strings while removing PHP comments.
- Return `mixed` instead of an invalid `undefined` property type when inference is inconclusive.

## 1.3.1 - 2026-08-21

### Fixed

- Prevent unterminated PHP block comments from hanging the VS Code extension host.
- Update vulnerable transitive development dependencies.

### Added

- Add focused unit tests for PHPDoc generation and comment parsing.
- Add continuous integration checks for linting, tests, dependency auditing, and VSIX packaging.
