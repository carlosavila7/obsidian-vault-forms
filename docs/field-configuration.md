# Field configuration

On Vault Forms settings tab you can access the field configuration modal going to `Create Form` > `Add new Field`. This will open the form to create a field:

![Create new field form](./assets/Screenshot%202025-09-13%20at%2012.47.51.png)

| Property              | Description                                                                                                                                                     | Value expected                                                               | required/optional                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------- |
| Type                  | Selects the type of the form field to be created.                                                                                                               | `text`, `date`, `time`, `dropdown`, `number`, `toggle`, `range`, `textarea`. | `required`                                         |
| Name                  | Field name.                                                                                                                                                     | Any text value.                                                              | `required`                                         |
| Class Name            | Defines the field class name. By Default the class name is defined based on the field name. It can't be edited on this form. It has its own form to be handled. | Alpha-numeric text.                                                          | `required`                                         |
| Description           | Field description.                                                                                                                                              | Any text value.                                                              | `optional`                                         |
| Placeholder           | Field placeholder. Supported on `text`, `textarea` and `number` field types.                                                                                    | Any text value.                                                              | `optional`                                         |
| Hide Expression       | [Expression](expressions.md) to hide the field depending on its result after evaluation.                                                                                     | `true`/`false`.                                                              | `optional`. If empty the field is never hidden.    |
| Required              | Defines wether or not a field is required to be filled to submit the form.                                                                                      | `true`/`false`.                                                              | `required`. Already set as true on field creation. |
| Value                 | Initial field value to be set on the form open.                                                                                                                 | It depends on the field type.                                                | `optional`                                         |
| Write to Output Noade | Defines wether or not a field will be written on the output note frontmatter.                                                                                   | `true`/`false`                                                               | `required`. Already set as true on field creation.                                               |

## Field types

Each field type renders a different component that changes how the user inputs data to the form. Properties listed above are common to most field types. Some properties are specific to define certain types of fields. Here is a detailed explanation of each field type:

### Text

Simple input field that allows users to enter plain text. It is suitable for collecting short, freeform responses such as names, titles, or other single-line information. The field supports optional properties like placeholder and description to guide user input.

![Text field example](./assets/Screenshot%202025-09-13%20at%2013.36.34.png)

### Textarea

Field type that provides a multi-line input area for users to enter longer, freeform text. It is ideal for collecting detailed responses, comments, or descriptions. Like the text field, it supports optional properties such as placeholder and description to help guide user input.

![Textarea field example](./assets/Screenshot%202025-09-13%20at%2013.45.16.png)

### Number

This field type provides an input for numeric values. It is ideal for collecting quantities, measurements, or any data that requires a number. The field can include optional properties like placeholder and description to guide user input and may support validation for minimum and maximum values.

![Number field example](./assets/Screenshot%202025-09-13%20at%2014.27.23.png)

### Date

This field type allows users to select a date from a calendar picker. It is useful for capturing specific dates such as deadlines, events, or birthdays. This field ensures consistent date formatting and simplifies date input for users.

If it's desired to set a initial value for this field type, as explained on the property value of the creation field, there are some formats that are expected. Those are: `YYYY-MM-DD`, `YYYY/MM/DD`, `DD-MM-YYYY` and `DD/MM/YYYY`

![Date field example](./assets/Screenshot%202025-09-13%20at%2013.49.05.png)

### Time

This field type allows users to select a specific time using a time picker. It is useful for capturing times such as appointments, reminders, or schedules, ensuring consistent formatting and easy input.

The format expected here is `HH:mm` (24h format).

![Time field example](./assets/Screenshot%202025-09-13%20at%2014.19.22.png)

### Toggle

This type displays a switch that users can turn on or off. It is useful for capturing boolean choices, such as enabling or disabling a feature, or selecting between two options like yes/no or true/false.

For defining its value it is expected `true` or `false`.

![Toggle field example](./assets/Screenshot%202025-09-13%20at%2014.30.28.png)

### Dropdown

This field type presents a list of predefined options for users to select from. It is ideal for choices where only one option should be selected, such as categories, statuses, or preferences. This field ensures consistent input and simplifies selection from multiple values.

The dropdown field has one additional property to define the options to be displayed in the component.

| Property | Description | Value expected | required/optional |
| - | - | - | - |
| Options | List of items to be displayed on the component. | Array of strings. Ex: `["First option", "Second option"]` | `required` |
| Value                 | Initial field value to be set on the form open.                                                                                                                 | Has to be one of the values listed in `Options`                                                | `optional`                                         |

![Dropdown field example](./assets/Screenshot%202025-09-13%20at%2014.34.14.png)

### Range

This field type provides a slider for users to select a value within a specified numeric range. It is useful for inputs like ratings, scales, or any scenario where a value between a minimum and maximum is needed. The slider offers a quick and intuitive way to choose a value.

The range field has some additional properties to define its behavior.

| Property | Description | Value expected | required/optional |
| - | - | - | - |
| Max | Slider maximum value. | Any numeric value greater than Min value. | `required` |
| Min | Slider minimum value. | Any numeric value lesser than Max value. | `required` |
| Step | Steps in which the slider will vary. | Any numeric value greater than zero. | `required` |

![Range field example](./assets/Screenshot%202025-09-13%20at%2014.54.50.png)

---

To deepen your understanding of how fields can be dynamically configured and automated, continue by reading the [expressions](expressions.md) guide and exploring practical [use cases](usecases.md). These references will help you unlock advanced features and see real-world examples of Vault Forms in action.
