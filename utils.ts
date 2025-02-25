import { IFieldData } from "src/form";
import {
	FORM_FIELD_ELEMENT_TYPE,
	FormField,
} from "src/form-field/form-field.constants";

export function fromFormDataToFormField(formData: IFieldData[]): FormField {
	const formDataMap = new Map();

	formData.map((fieldData) =>
		formDataMap.set(fieldData.className, fieldData)
	);

	const formField = {
		type: formDataMap.get("field-type")?.fieldValue,
		name: formDataMap.get("field-name")?.fieldValue,
		className: formDataMap.get("field-class-name")?.fieldValue,
		description: formDataMap.get("field-description")?.fieldValue,
		placeholder: formDataMap.get("field-placeholder")?.fieldValue,
		hideExpression: formDataMap.get("field-hide-expression")?.fieldValue,
		content: {
			expression: formDataMap.get("field-default-value")?.fieldValue,
		},
		required: formDataMap.get("field-required").fieldValue,
		options: {
			expression: formDataMap.get("field-dropdown-options")?.fieldValue,
		},
	} as FormField;

	return formField;
}

export function getDataAsFrontmatter(data: IFieldData[]): string {
	let frontmatterString = "";
	data.map((formData) => {
		const stringValue =
			formData.fieldType === FORM_FIELD_ELEMENT_TYPE.DROPDOWN ||
			formData.fieldType === FORM_FIELD_ELEMENT_TYPE.TEXT
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
