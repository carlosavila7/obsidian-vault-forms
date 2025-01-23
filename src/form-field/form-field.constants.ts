import { DropdownFormField } from "./dropdown-form-field.factory";
import {
	DateFormFieldField,
	TextFormFieldField,
	TimeFormFieldField,
} from "./text-form-field.factory";

export enum FORM_FIELD_ELEMENT_TYPE {
	TEXT = "text",
	DATE = "date",
	TIME = "time",
	DROPDOWN = "dropdown",
	NUMBER = "number",
}

export enum FORM_FIELD_STATE {
	INITIALIZED = "initialized",
	CREATED = "created",
}

export type FormField =
	| TextFormFieldField
	| DateFormFieldField
	| TimeFormFieldField
	| DropdownFormField;
