import { App, Notice, Setting } from "obsidian";
import { BaseFormField, FormFieldFactory } from "./form-field.factory";
import { FORM_FIELD_ELEMENT_TYPE } from "./form-field.constants";

export class TextFormFieldField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.TEXT;
}
export class DateFormFieldField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.DATE;
}
export class TimeFormFieldField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.TIME;
}

export class TextFormFieldFactory extends FormFieldFactory {
	constructor(params: {
		contentEl: HTMLElement;
		app: App;
		formField: TextFormFieldField;
		expressionContext: FormFieldFactory[];
		bypassExpressionEvaluation?: boolean;
	}) {
		super(params);
	}

	protected getSetting(): Setting {
		const setting = new Setting(this.contentEl)
			.setName(this.formField.name)
			.setClass(this.formField.className)
			.addText((text) => text.onChange(this.updateField.bind(this)));

		return setting;
	}

	set value(valueToSet: string) {
		const fieldEl = this.contentEl.querySelector(
			this.getFormFieldHtmlPath()
		);
		if (fieldEl instanceof HTMLInputElement) {
			fieldEl.value = valueToSet;
			this.formField.content["value"] = valueToSet;
		} else
			new Notice(
				`Can't find field element: ${this.getFormFieldHtmlPath()}`
			);
	}
}
