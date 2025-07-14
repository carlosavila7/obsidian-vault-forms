import { Notice } from "obsidian";
import { TextFormFieldFactory } from "./text-form-field.factory";
import { BaseFormField } from "./form-field.factory";
import { FORM_FIELD_ELEMENT_TYPE } from "./form-field.constants";

export class TimeFormFieldField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.TIME;
}

export class TimeFormFieldFactory extends TextFormFieldFactory {
	private normalizeToTimeString(
		input: Date | string | number 
	): string | undefined {
		let dateObj: Date | undefined;

		if (input instanceof Date) {
			dateObj = input;
		} else if (typeof input === "number") {
			dateObj = new Date(input);
		} else if (typeof input === "string") {
			// Try to match HH:mm or H:m
			let match = input.match(/^(\d{1,2}):(\d{1,2})$/);
			if (match) {
				const hh = match[1].padStart(2, "0");
				const mm = match[2].padStart(2, "0");
				return `${hh}:${mm}`;
			}
			// Try to parse as Date string
			const parsed = Date.parse(input);
			if (!isNaN(parsed)) {
				dateObj = new Date(parsed);
			}
		}

		if (dateObj && !isNaN(dateObj.getTime())) {
			const hh = String(dateObj.getHours()).padStart(2, "0");
			const mm = String(dateObj.getMinutes()).padStart(2, "0");
			return `${hh}:${mm}`;
		}
		return undefined;
	}

	protected async assignValue(
		value?: string,
		updatedBy?: string
	): Promise<void> {
		let valueToAssign = value
			? value
			: await this.expressionEvaluator.evaluateExpression<
					Date | string | number
			  >(this.formField.content?.expression, this.expressionContext);

		const normalized = this.normalizeToTimeString(valueToAssign);
		if (!normalized) {
			new Notice(`Unexpected format for time field. Expected is HH:mm`);
			return;
		}

		if (normalized === this.formField.content.value) return;

		this.value = normalized;
	}
}
