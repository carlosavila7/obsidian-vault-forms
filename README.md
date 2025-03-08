# Todo

- [X] Structure form class
    - form name
    - get form result
- [ ] Build interface to configure forms
    - [X] Create form
    - [X] List created forms
        - Add togle to activate forms according to the toogle state
    - [X] Delete form
    - [ ] Update form
        - Try to use the same modal class to create form. In this case, the form is rendered filled with the info from the form that is being updated.

### refactoring

- [ ] Rethink class implementation to optimize overwritten methods

### features
 - [ ] Togle field
 - [ ] Slider field

### bugs
- [X] Update one field updates all fields 
- [X] When deleting the content of a field that has expression, it triggers the expression to run, filling the field again.
    - Makes impossible to have the field as blank