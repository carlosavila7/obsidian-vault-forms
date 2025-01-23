import { Notice } from "obsidian";
import { TextFormFieldFactory } from "./text-form-field.factory";

export class TimeFormFieldFactory extends TextFormFieldFactory {
	protected async assignValue(
		value?: string,
		updatedBy?: string
	): Promise<void> {
        // TODO: improve logic here to handle datetime
		let valueToAssing = value
			? value
			: await this.evaluateExpression(
					this.formField.content?.expression,
					this.expressionContext
			  );

		let [hour, minute] = valueToAssing.split(":");

		if (!hour || !minute) {
			new Notice(`Unexpected format for time field. Expected is HH:mm`);
			return;
		}

		hour = hour.length === 2 ? hour : `0${hour}`;
		minute = minute.length === 2 ? minute : `0${minute}`;

		valueToAssing = `${hour}:${minute}`;

		if (valueToAssing === this.formField.content.value) return;

		this.value = valueToAssing;
	}
}