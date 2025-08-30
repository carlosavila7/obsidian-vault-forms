import { IForm } from "src/form";
import {
	FORM_FIELD_ELEMENT_TYPE,
	FormField,
} from "src/form-field/form-field.constants";

export interface FormBo extends IForm {
	id: string;
	active: boolean;
}

export interface MyPluginSettings {
	forms: FormBo[];
}

export const handleFormField = ():FormField[] => [
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "Type",
		className: "field-type",
		content: { value: undefined },
		options: { value: Object.values(FORM_FIELD_ELEMENT_TYPE) },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Name",
		description: { value: "Enter the field name" },
		className: "field-name",
		required: true,
		content: { value: undefined },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Class name",
		description: { value: "Field identifier" },
		className: "field-class-name",
		content: {
			value: undefined,
			expressionParams: {
				expression:
					"field-{{$$.field-name.toLowerCase().replaceAll(' ', '-')}}",
			},
		},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Description",
		description: { value: "Optional - Enter field description" },
		className: "field-description",
		content: { value: undefined },
		bypassValueExpressionEvaluation: true,
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Placeholder",
		hideExpression: {
			value: undefined,
			expressionParams: {
				expression: "{{['dropdown','range'].includes($$.field-type)}}",
			},
		},
		description: { value: "Optional - Enter field placeholder" },
		className: "field-placeholder",
		bypassValueExpressionEvaluation: true,
		content: { value: undefined },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Hide Expression",
		description: {
			value: "Optional - Enter expression to hide field if true",
		},
		className: "field-hide-expression",
		bypassValueExpressionEvaluation: true,
		placeholder: { value: "{{field-foo === 'bar'}}" },
		content: { value: undefined },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TOGGLE,
		name: "Required",
		description: {
			value: "To be replaced by toggle element. 1 for true, 0 false",
		},
		className: "field-required",
		hideExpression: {
			value: undefined,
			expressionParams: {
				expression: "{{['toggle','range'].includes($$.field-type)}}",
			},
		},
		content: {
			value: undefined,
			expressionParams: {
				expression:
					"{{['toggle','range'].includes($$.field-type) ? 'false' : 'true' }}",
			},
		},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXTAREA,
		name: "Min",
		description: { value: "Enter the range min value" },
		placeholder: { value: "1" },
		className: "field-min",
		hideExpression: {
			value: undefined,
			expressionParams: { expression: "{{$$.field-type !== 'range'}}" },
		},
		content: { value: undefined },
		bypassValueExpressionEvaluation: true,
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXTAREA,
		name: "Max",
		description: { value: "Enter the range max value" },
		placeholder: { value: "10" },
		className: "field-max",
		hideExpression: {
			value: undefined,
			expressionParams: { expression: "{{$$.field-type !== 'range'}}" },
		},
		content: { value: undefined },
		bypassValueExpressionEvaluation: true,
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXTAREA,
		name: "Step",
		description: { value: "Steps in which the slider will vary" },
		className: "field-step",
		hideExpression: {
			value: undefined,
			expressionParams: { expression: "{{$$.field-type !== 'range'}}" },
		},
		content: { value: undefined, expressionParams: { expression: "1" } },
		bypassValueExpressionEvaluation: true,
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Default Value",
		description: {
			value: "Optional - Involve in {{ }} to write expression",
		},
		className: "field-default-value",
		bypassValueExpressionEvaluation: true,
		content: { value: undefined },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Options",
		description: {
			value: "Array of options - Involve in {{}} to write expression",
		},
		placeholder: { value: "{{ ['itemA', 'itemB']}}" },
		className: "field-dropdown-options",
		hideExpression: {
			value: undefined,
			expressionParams: {
				expression: "{{$$.field-type !== 'dropdown'}}",
			},
		},
		content: { value: undefined },
	},
];
