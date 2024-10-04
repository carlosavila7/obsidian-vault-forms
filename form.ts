import { Setting } from "obsidian";

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

class FormFieldContent {
	expression?: string;
	value?: string;
}

class BaseFormField {
	state?: FORM_FIELD_STATE;
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
	value?: string[];
	expression?: string;
}

export class DropdownFormField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.DROPDOWN;
	options: DropdownOptions;
}

export type FormField =
	| TextFormFieldField
	| DateFormFieldField
	| TimeFormFieldField
	| DropdownFormField;

export const personalFinanceReportExample: FormField[] = [
	{
		type: FORM_FIELD_ELEMENT_TYPE.DATE,
		name: "Date",
		description: "Enter expense date",
		className: "date",
		content: { expression: '{{new Date().toISOString().split("T")[0]}}' },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TIME,
		name: "Time",
		description: "Enter expense time",
		className: "time",
		content: {
			expression:
				"{{`${new Date().getHours()}:${new Date().getMinutes()}`}}",
		},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "Category",
		className: "category",
		description: "Select expense category",
		content: {},
		options: { expression: "{{%%expenses-dictionary.md%%.categories}}" },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "Sub-Category",
		className: "sub-category",
		description: "Select expense sub-category",
		content: {},
		options: {
			expression: "{{%%expenses-dictionary.md%%[$$.category]}}",
		},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.NUMBER,
		name: "Cost",
		className: "cost",
		description: "Enter how much it cost",
		content: {}
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "Origin",
		description: "Select expense payment origin",
		className: "origin",
		content: {},
		options: {expression: '{{%%expenses-dictionary.md%%.origin}}'}
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "Payment type",
		description: "Select expense payment type",
		className: "payment-type",
		content: {},
		options: {expression: '{{%%expenses-dictionary.md%%[`${$$.origin === "voucher" ? "voucher" : "payment-type"}`]}}'}
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Description",
		description: "Enter expense description",
		className: "description",
		content: {}},
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "City",
		description: "Select where it was spent",
		className: "city",
		content: {},
		options: {expression: '{{%%expenses-dictionary.md%%.city}}'}
	},
];

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
		content: {
			expression:
				"{{%%expenses/1716155633804.md%%.category + ' ' + $$.field01}}",
		},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Field 03",
		description: "third field",
		className: "field03",
		content: { expression: "{{$$.field02}}" },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.NUMBER,
		name: "Field 00",
		description: "cost field",
		className: "costfield",
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "Field 04",
		description: "forth field",
		className: "field04",
		content: { expression: "{{$$.field03}}" },
		options: { value: ["a", "b"] },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "Field 05",
		description: "fifth field",
		className: "field05",
		content: { expression: "{{$$.field02}}" },
		options: {
			expression:
				"{{Object.values(%%my props.md%%).map(i => i.toUpperCase())}}",
		},
	},
];
