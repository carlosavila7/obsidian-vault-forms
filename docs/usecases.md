# Use Cases & Examples for Obsidian Frontmatter Form

This document provides practical examples and use cases to help you structure forms and leverage the full capabilities of the Obsidian Frontmatter Form plugin.

## 1. Basic Metadata Form
A simple form to edit note metadata such as title, status, and tags.

```json
{
  "fields": [
    { "type": "text", "className": "title", "label": "Title" },
    { "type": "dropdown", "className": "status", "label": "Status", "options": ["Draft", "In Progress", "Complete"] },
    { "type": "textarea", "className": "tags", "label": "Tags" }
  ]
}
```

## 2. Dynamic Field Values with Expressions
Automatically set a field value based on other fields.

```json
{
  "fields": [
    { "type": "text", "className": "projectName", "label": "Project Name" },
    { "type": "date", "className": "startDate", "label": "Start Date" },
    {
      "type": "text",
      "className": "summary",
      "label": "Summary",
      "expression": "{{ $$.projectName + ' started on ' + $$.startDate }}"
    }
  ]
}
```

## 3. Referencing File Content
Pull frontmatter from another file in your vault.

```json
{
  "fields": [
    { "type": "text", "className": "relatedNote", "label": "Related Note" },
    {
      "type": "textarea",
      "className": "noteFrontmatter",
      "label": "Note Frontmatter",
      "expression": "{{ %%Notes/{{$$.relatedNote}}%% }}"
    }
  ]
}
```

## 4. Folder Listing for Dropdown Options
Populate a dropdown with file names from a folder.

```json
{
  "fields": [
    {
      "type": "dropdown",
      "className": "projectFile",
      "label": "Select Project File",
      "options": "{{ %%Projects/%% }}"
    }
  ]
}
```

## 5. Advanced: Combining Multiple Features
A form that uses toggles, ranges, and combines expressions for a summary field.

```json
{
  "fields": [
    { "type": "toggle", "className": "isActive", "label": "Active?" },
    { "type": "range", "className": "progress", "label": "Progress", "min": 0, "max": 100 },
    {
      "type": "text",
      "className": "statusSummary",
      "label": "Status Summary",
      "expression": "{{ ($$.isActive ? 'Active' : 'Inactive') + ' - ' + $$.progress + '% complete' }}"
    }
  ]
}
```

## Tips for Structuring Forms
- Use meaningful `className` values for easy reference in expressions.
- Leverage expressions to automate and link field values.
- Reference files and folders to integrate vault data dynamically.
- Combine multiple field types for rich metadata editing.

---
For more details on expressions, see [expressions.md](./expressions.md). For plugin overview, see [readme.md](./readme.md).
