# Use Cases & Examples for Obsidian Frontmatter Form

This document provides practical examples and use cases to help you structure forms and leverage the full capabilities of the Obsidian Frontmatter Form plugin.

## 1. Dropdown options from file

Referencing a file property to use as dropdown options:

Expression:

```js
{{ %%dictionary%%["property-array"] }}
```

`dictionary.md` file frontmatter:

```yml
property: value
property-array:
  - item A
  - item B
  - item C
```

![Dropdown options from file use case](assets/Screenshot%202025-09-14%20at%2014.57.19.png)

## 2. Dropdown options from folder

Referencing a folder to use as dropdown options:

Expression:

```js
{{ %%Files/%% }}
```

Folder structure:

```txt
Files/
├── File 1.md
├── File 2.md
└── File 3.md
```

![Dropdown options from folder use case](assets/Screenshot%202025-09-14%20at%2015.04.58.png)

## 3. Set current datetime on date and time fields

The value property of both date and time type fields handles JS Date in addition to strings formats like `YYYY-MM-DD`, or `HH:mm` in case of time fields. So to set them to the current date/time is very simple:

Expression:

```js
{{ new Date() }}
```

![Current date time use case](assets/Screenshot%202025-09-14%20at%2015.21.01.png)

## Tips for Structuring Forms

- Use meaningful `className` values for easy reference in expressions.
- Leverage expressions to automate and link field values.
- Reference files and folders to integrate vault data dynamically.
- Combine multiple field types for rich metadata editing.

---
For more details on expressions, see [expressions.md](./expressions.md). For plugin overview, see [readme.md](./readme.md). Use case listed here can be found on the [example vault](https://github.com/carlosavila7/vault-forms-example/tree/main) for this plugin.
