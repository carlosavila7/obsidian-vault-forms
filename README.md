# Todo

- [X] Structure form class
    - form name
    - get form result
- [X] Build interface to configure forms
    - [X] Create form
    - [X] List created forms
        - Add togle to activate forms according to the toogle state
    - [X] Delete form
    - [X] Update form
        - Try to use the same modal class to create form. In this case, the form is rendered filled with the info from the form that is being updated.
- [X] Change required setting on form creation to be a toggle form field
- [X] Move settings code currently on `main.ts` to a separate file

### refactoring

- [X] Rethink class implementation to optimize overwritten methods
    - methods that are overwritten on children classes must be abstract on the base class
    - when making methods abstract to be implemented by children, keep the common logic on the base class

### features
 - [X] Togle field  
    - [X] When implement this on the form field modal, add expression to set as not required if it has hide expression
 - [X] Slider field
 - [X] Test expresson while creating/updating a form field
 - [ ] While reading a path, if the the path resolves to a folder, the output must be an array of the file names inside of it. Currently it does not work if the path is not referencing a note
    - this could be use to create links between notes. Relational data
 - [ ] Enable the user to customize the naming of a resultant note on the submit of the form
    - allow to reference fields to compose the name.
 - [ ] Review the special caracters to reference fields on expressions
    - allow it to be changed on the settings page

### bugs
- [X] Update one field updates all fields 
- [X] When deleting the content of a field that has expression, it triggers the expression to run, filling the field again.
    - Makes impossible to have the field as blank
- [X] Hide expression not working on dropdown fields
    - Try to point to a text field instead of another dropdown to hide the field