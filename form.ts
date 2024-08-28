import { Setting } from "obsidian";

export enum FORM_FIELD_ELEMENT_TYPE {
	TEXT = "text",
	DATE = "date",
	TIME = "time",
	DROPDOWN = "dropdown",
}

class BaseFormField {
	name: string;
	className: string;
	type: FORM_FIELD_ELEMENT_TYPE;
	description?: string;
	content: { expression?: string; value?: string };
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
		className: "field-1",
		content: { expression: 'hello world' },
	},
	// {
	// 	type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
	// 	name: "Dropdown",
	// 	description: "select an option",
	// 	className: "my-dropdown",
	// 	content: { expression: "$$.added-option" },
	// 	options: { Goleiro: "GOLEIRO", Zagueiro: "ZAGUEIRO" },
	// },
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "Field 02",
		description: "second field",
		className: "field-2",
		content: { expression: "{{$$.field-1 === `A` ? `option 1` : `option 2`}}" },
		options: {'hello': 'hello'}
	},
	// {
	// 	type: FORM_FIELD_ELEMENT_TYPE.TEXT,
	// 	name: "Evaluation field",
	// 	description: "here is your description",
	// 	className: "evaluate-input",
	// 	content: { expression: "{{'$$.result-input'.toUpperCase()}}" },
	// },
	// {
	// 	name: "My source field",
	// 	className: "my-source-field",
	// 	type: FORM_FIELD_ELEMENT_TYPE.TEXT,
	// 	description: "my description",
	// 	content: { value: "my value" },
	// },
	// {
	// 	type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
	// 	className: "my-dropdown-field",
	// 	name: "My Dropdown field",
	// 	options: { "Opt 1": "Carlos", "Opt 2": "Rayane" },
	// 	description: "Bom dia",
	// 	content: { source: "$$.my-source-field"},
	// },
	// {
	// 	name: "My replica field",
	// 	className: "my-replica-field",
	// 	type: FORM_FIELD_ELEMENT_TYPE.TEXT,
	// 	description: "my description",
	// 	content: { source: "$$.my-source-field" },
	// },
	// {
	// 	name: "My date field",
	// 	className: "my-date-field",
	// 	type: FORM_FIELD_ELEMENT_TYPE.DATE,
	// 	description: "Insert the date",
	// 	content: { value: "2020-01-01" },
	// },
	// {
	// 	name: "My time field",
	// 	className: "my-time-field",
	// 	type: FORM_FIELD_ELEMENT_TYPE.TIME,
	// 	description: "Insert the time",
	// 	content: { value: "10:00" },
	// },
];
