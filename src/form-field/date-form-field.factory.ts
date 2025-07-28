import { Notice } from "obsidian";
import { TextFormFieldFactory } from "./text-form-field.factory";
import { BaseFormField } from "./form-field.factory";
import { FORM_FIELD_ELEMENT_TYPE } from "./form-field.constants";

export class DateFormFieldField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.DATE;
}

export class DateFormFieldFactory extends TextFormFieldFactory {
	private normalizeToDateString(
		input: Date | string | number
	): string | undefined {
		let dateObj: Date | undefined;

		if (input instanceof Date) {
			dateObj = input;
		} else if (typeof input === "number") {
			dateObj = new Date(input);
		} else if (typeof input === "string") {
			// Try to parse common formats
			// YYYY-MM-DD or YYYY/MM/DD
			let match = input.match(/^(\d{4})[-\/](\d{2})[-\/](\d{2})$/);
			if (match) {
				return `${match[1]}-${match[2]}-${match[3]}`;
			}
			// DD-MM-YYYY or DD/MM/YYYY
			match = input.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
			if (match) {
				return `${match[3]}-${match[2]}-${match[1]}`;
			}
			// Try Date.parse fallback
			const parsed = Date.parse(input);
			if (!isNaN(parsed)) {
				dateObj = new Date(parsed);
			}
		}

		if (dateObj && !isNaN(dateObj.getTime())) {
			// Format as YYYY-MM-DD
			const YYYY = dateObj.getFullYear();
			const MM = String(dateObj.getMonth() + 1).padStart(2, "0");
			const DD = String(dateObj.getDate()).padStart(2, "0");
			return `${YYYY}-${MM}-${DD}`;
		}
		return undefined;
	}

	protected async assignValue(
		value?: string,
		updatedBy?: string
	): Promise<void> {
		// Evaluate or use provided value
		let valueToAssign = value
			? value
			: await this.expressionEvaluator.evaluateExpression<
					Date | string | number
			  >(this.formField.content.expressionParams);

		const normalized = this.normalizeToDateString(valueToAssign);
		if (!normalized) {
			new Notice(
				`Unexpected format for date field. Expected is YYYY-MM-DD`
			);
			return;
		}

		if (normalized === this.formField.content.value) return;
		console.log("Normalized", normalized);
		this.value = normalized;
	}
}
