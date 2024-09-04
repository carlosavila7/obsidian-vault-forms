import { Setting } from "obsidian";

export enum FORM_FIELD_ELEMENT_TYPE {
	TEXT = "text",
	DATE = "date",
	TIME = "time",
	DROPDOWN = "dropdown",
}

class FormFieldContent {
	expression?: string;
	value?: string;
}

class BaseFormField {
	name: string;
	className: string;
	type: FORM_FIELD_ELEMENT_TYPE;
	description?: string;
	content: FormFieldContent;
	setting?: Setting;
}

export class TextFormFieldField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.TEXT;
}

export class DateFormFieldField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.DATE;
}

export class TimeFormFieldField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.TIME;
}

class DropdownOptions {
	value?: Record<string, string>;
	expression?: string;
}

export class DropdownFormField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.DROPDOWN;
	options: Record<string, string>;
}

export type FormField =
	| TextFormFieldField
	| DateFormFieldField
	| TimeFormFieldField
	| DropdownFormField;

export const formFieldExamples: FormField[] = [
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Field 01",
		description: "first field",
		className: "field01",
		content: { expression: "{{%%expenses/1716155614454.md%%.category}}" },
		// options: { a: "a", b: "b" },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Field 02",
		description: "second field",
		className: "field02",
		content: { expression: "{{%%expenses/1716155633804.md%%.category + ' ' + $$.field01}}" },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Field 03",
		description: "third field",
		className: "field03",
		content: { expression: "{{$$.field02}}" },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "Field 04",
		description: "forth field",
		className: "field04",
		content: { expression: "{{$$.field03}}" },
		options: { a: "a", b: "b" },
	}
];
