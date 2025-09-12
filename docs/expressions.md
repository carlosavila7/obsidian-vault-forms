# Expressions in Obsidian Frontmatter Form

Expressions allow you to dynamically compute field values based on other fields, files, or folders within your Obsidian vault. This feature enables advanced automation and context-aware metadata management.

## How Expressions Are Evaluated
Expressions are written using JavaScript-like syntax and can reference other form fields or vault content. The plugin parses and evaluates these expressions at runtime, replacing references with their actual values.

- **Basic Syntax:**
  - Wrap the expression in double curly braces: `{{ ... }}`
  - Example: `{{ $$ .fieldName + ' - ' + $$ .anotherField }}`
- **Minification:**
  - Whitespace is automatically trimmed and condensed for evaluation.
- **Error Handling:**
  - If an expression fails to evaluate, a notice is shown and the field will fallback to its prefix/suffix or remain empty.

## Referencing Other Fields
To reference the value of another field in your form, use the following syntax:

```
$$.fieldClassName
```
- `fieldClassName` is the unique class name of the form field you want to reference.
- Example: `{{ $$.projectName }}` will insert the value of the field with class name `projectName`.

## Referencing Files and Folders
You can pull data from files or folders in your vault using the following syntax:

- **File Content:**
  - Use double percent signs to reference a file: `%%path/to/file%%`
  - Example: `{{ %%Projects/ProjectA%% }}` will insert the frontmatter of `Projects/ProjectA.md`.
- **Folder Content:**
  - Reference a folder by ending the path with a slash: `%%path/to/folder/%%`
  - Example: `{{ %%Projects/%% }}` will insert a list of file names in the `Projects` folder.
- **File Extension:**
  - Only `.md` files are supported. Other extensions will result in an error notice.

## Combining References
You can combine field and file references in your expressions:

```
{{ $$.projectName + ' - ' + %%Projects/%% }}
```
This will concatenate the value of `projectName` with the list of files in the `Projects` folder.

## Example Expressions
- Reference another field: `{{ $$.status }}`
- Reference a file's frontmatter: `{{ %%Notes/Meeting.md%% }}`
- Reference a folder's file names: `{{ %%Notes/%% }}`
- Combine values: `{{ $$.title + ' (' + $$.date + ')' }}`

## Notes
- Expressions are evaluated asynchronously; file and folder references may take longer to resolve.
- Invalid references or missing files/folders will trigger a notice in Obsidian.

---
For more details, see the main [README.md](./readme.md) or explore the source code for `ExpressionEvaluator` in `src/utils/expression-evaluator.ts`.
