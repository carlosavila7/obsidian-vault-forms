import {
	FORM_FIELD_ELEMENT_TYPE,
	FormField,
} from "src/form-field/form-field.constants";

export const hideExpressionExample: FormField[] = [
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "Type",
		className: "type",
		content: {},
		options: { value: ["text", "date", "time", "number", "dropdown"] },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Name",
		className: "name",
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Class name",
		className: "class-name",
		content: {
			expression: "{{$$.name.toLowerCase().replaceAll(' ', '-')}}",
		},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Description",
		description: "optional",
		className: "description",
		content: {},
	},

	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Placeholder",
		description: "optional",
		className: "placeholder",
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Default Value",
		description: "Involve in {{}} to write expression",
		className: "default-value",
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Options",
		description: "Array of options",
		placeholder: "['itemA', 'itemB']",
		className: "options",
		hideExpression: "{{$$.type !== 'dropdown'}}",
		content: {},
	},
];

export const personalFinanceReportExample: FormField[] = [
	{
		type: FORM_FIELD_ELEMENT_TYPE.DATE,
		name: "Date",
		description: "Enter expense date",
		className: "date",
		// hideExpression: "true",
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
		// hideExpression: "true",
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
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "Origin",
		description: "Select expense payment origin",
		className: "origin",
		hideExpression: "$$.cost === 10",
		content: {},
		options: { expression: "{{%%expenses-dictionary.md%%.origin}}" },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "Payment type",
		description: "Select expense payment type",
		className: "payment-type",
		content: {},
		options: {
			expression:
				'{{%%expenses-dictionary.md%%[`${$$.origin === "Voucher" ? "voucher" : "payment-type"}`]}}',
		},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Bougth at",
		description: "Enter where it was spent",
		className: "bought-at",
		placeholder: "Seller`s name",
		content: {},
		options: { expression: "{{%%expenses-dictionary.md%%.city}}" },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "City",
		description: "Select where it was spent",
		className: "city",
		content: {},
		options: { expression: "{{%%expenses-dictionary.md%%.city}}" },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Description",
		description: "Enter expense description",
		placeholder: "Expense description",
		className: "description",
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Grouping Tag",
		description: "Add tag to semantic grouping",
		placeholder: "#semanticTag",
		className: "grouping-tag",
		content: {},
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
