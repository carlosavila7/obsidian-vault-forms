import { DateFormFieldField } from "./date-form-field.factory";
import { DropdownFormField } from "./dropdown-form-field.factory";
import { RangeFormField } from "./range-form-field.factory";
import { TextFormFieldField } from "./text-form-field.factory";
import { TimeFormFieldField } from "./time-form-field.factory";
import { ToggleFormField } from "./toggle-form-field.factory";

export enum FORM_FIELD_ELEMENT_TYPE {
	TEXT = "text",
	DATE = "date",
	TIME = "time",
	DROPDOWN = "dropdown",
	NUMBER = "number",
	TOGGLE = "toggle",
	RANGE = "range",
	TEXTAREA = "textarea",
}

export enum FORM_FIELD_STATE {
	INITIALIZED = "initialized",
	CREATED = "created",
}

export type FormField =
	| TextFormFieldField
	| DateFormFieldField
	| TimeFormFieldField
	| DropdownFormField
	| ToggleFormField
	| RangeFormField;
