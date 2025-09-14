# Form configuration

On Vault Forms settings tab you can access the form configuration modal going to `Create Form`. This will open the form to create a field:

![Form to create new form](./assets/Screenshot%202025-09-13%20at%2017.30.17.png)

| Property | Description | required/optional |
| - | - | - |
| Form name | Form name. | `required` |
| Form description | Form description | `optional` |
| Output path | Folder in your vault where the notes will be created on the form submit | `required` |
| Output name | Name of the output notes. There can't be two notes with the same name, so the value here must be dynamic. Use [expressions](./expressions.md) to reference field values. | `optional`. If empty, the default name will be the timestamp when the form was submitted. |
| Submit label | Label to be displayed on the submit button | `optional`. If empty, the label will be `Submit`. |
| Show ribbon icon | Defines wether or not a ribbon icon will be created to open the form. | `optional`|
| Ribbcon icon name | Name of the icon to be set when creating the ribbon icon. See [lucide.dev](https://lucide.dev/icons/) for reference of icon names expected. | `required`, if `Show ribbon icon` is checked. |

## Fields

The "Fields" section displays a list of all fields included in the form. Each field shows its name, type, and identifier (class name). Users can reorder fields, edit their configuration, edit their class name or delete them using the provided controls. The section also includes buttons to add new fields or finalize the form creation.

![Fields section](./assets/Screenshot%202025-09-13%20at%2017.55.16.png)

The button `Add new field` opens the [field configuration](field-configuration.md) modal to configure and create new fields. There must be at least one field configured to create a form.
