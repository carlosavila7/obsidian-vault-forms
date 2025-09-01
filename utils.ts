import { IFieldData } from "src/form";
import { DropdownFormField } from "src/form-field/dropdown-form-field.factory";
import {
	FORM_FIELD_ELEMENT_TYPE,
	FormField,
} from "src/form-field/form-field.constants";
import { ExpressionProperty } from "src/form-field/form-field.factory";
import { RangeFormField } from "src/form-field/range-form-field.factory";

export function fromFormDataToFormField(formData: IFieldData[]): FormField {
	const formDataMap = new Map();

	formData.map((fieldData) =>
		formDataMap.set(fieldData.className, fieldData)
	);

	const buildExpressionProperty = (
		expression: string
	): ExpressionProperty<any> => ({
		value: undefined,
		expressionParams: { expression },
	});

	   const formField: FormField = {
		   type: formDataMap.get("field-type")?.fieldValue,
		   name: formDataMap.get("field-name")?.fieldValue,
		   className: formDataMap.get("field-class-name")?.fieldValue,
		   description: buildExpressionProperty(
			   formDataMap.get("field-description")?.fieldValue
		   ),
		   placeholder: buildExpressionProperty(
			   formDataMap.get("field-placeholder")?.fieldValue
		   ),
		   hideExpression: buildExpressionProperty(
			   formDataMap.get("field-hide-expression")?.fieldValue
		   ),
		   content: buildExpressionProperty(
			   formDataMap.get("field-default-value")?.fieldValue
		   ),
		   required: formDataMap.get("field-required").fieldValue === "true",
		   writeToOutputNote: formDataMap.get("field-write-to-output-note")?.fieldValue === "true",
	};

	if (formField.type === FORM_FIELD_ELEMENT_TYPE.DROPDOWN)
		(formField as DropdownFormField).options = buildExpressionProperty(
			formDataMap.get("field-dropdown-options")?.fieldValue
		);

	if (formField.type === FORM_FIELD_ELEMENT_TYPE.RANGE) {
		(formField as RangeFormField).minLimit = buildExpressionProperty(
			formDataMap.get("field-min")?.fieldValue
		);
		(formField as RangeFormField).maxLimit = buildExpressionProperty(
			formDataMap.get("field-max")?.fieldValue
		);
		(formField as RangeFormField).step = buildExpressionProperty(
			formDataMap.get("field-step")?.fieldValue
		);
	}

	return formField;
}

export function getDataAsFrontmatter(data: IFieldData[]): string {
	let frontmatterString = "";
	data.map((formData) => {
		const stringValue =
			formData.fieldType === FORM_FIELD_ELEMENT_TYPE.DROPDOWN ||
			formData.fieldType === FORM_FIELD_ELEMENT_TYPE.TEXT ||
			formData.fieldType === FORM_FIELD_ELEMENT_TYPE.TEXTAREA
				? `"${formData?.fieldValue ?? ""}"`
				: formData?.fieldValue;

		frontmatterString += `${formData.className}: ${stringValue}\n`;
	});

	return `---\n${frontmatterString}---`;
}

export function getClassNamesFromExpression(expression: string): string[] {
	const classNameMatcher = new RegExp(/\$\$\.([0-9a-zA-Z-\-]+)/, "g");
	let matches = undefined;
	const formFieldClassNames = [];

	while ((matches = classNameMatcher.exec(expression)) !== null)
		formFieldClassNames.push(matches[1]);

	return formFieldClassNames;
}

export function getFilePathsFromExpression(expression: string): string[] {
	const filePathMatcher = new RegExp(/%%([^%%]*)%%/, "g");

	let matches = undefined;
	const filePaths = [];

	while ((matches = filePathMatcher.exec(expression)) !== null)
		filePaths.push(matches[1]);

	return filePaths;
}

export function fromArrayToRecord(array?: string[]): Record<string, string> {
	if (!array) return {};

	const record: Record<string, string> = {};

	array.map((item) => {
		record[item] = item;
	});

	return record;
}

	export function isInputExpressionSyntaxValid(inputExpression: string): boolean {
		try {
			new Function(inputExpression);
			return true;
		} catch (_) {
			return false;
		}
	}