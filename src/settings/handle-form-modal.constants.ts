import {
	FORM_FIELD_ELEMENT_TYPE,
	FormField,
} from "src/form-field/form-field.constants";

export const handleFormField: FormField[] = [
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "Type",
		className: "field-type",
		content: {},
		options: { value: Object.values(FORM_FIELD_ELEMENT_TYPE) },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Name",
		description: "Enter the field name",
		className: "field-name",
		required: true,
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Class name",
		description: "Field identifier",
		className: "field-class-name",
		content: {
			expression:
				"field-{{$$.field-name.toLowerCase().replaceAll(' ', '-')}}",
		},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Description",
		description: "Optional - Enter field description",
		className: "field-description",
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Placeholder",
		hideExpression: "{{$$.field-type === 'dropdown'}}",
		description: "Optional - Enter field placeholder",
		className: "field-placeholder",
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Hide Expression",
		description: "Optional - Enter expression to hide field if true",
		className: "field-hide-expression",
		bypassValueExpressionEvaluation: true,
		placeholder: "{{field-foo === 'bar'}}",
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TOGGLE,
		name: "Required",
		description: "To be replaced by toogle element. 1 for true, 0 false",
		className: "field-required",
		hideExpression: "{{$$.field-type === 'toggle'}}",
		content: {
			expression: "{{$$.field-type === 'toggle' ? 'false' : 'true' }}",
		},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Default Value",
		description: "Optional - Involve in {{}} to write expression",
		className: "field-default-value",
		bypassValueExpressionEvaluation: true,
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Options",
		description: "Array of options - Involve in {{}} to write expression",
		placeholder: "{{ ['itemA', 'itemB']}}",
		className: "field-dropdown-options",
		hideExpression: "{{$$.field-type !== 'dropdown'}}",
		content: {},
	},
];
