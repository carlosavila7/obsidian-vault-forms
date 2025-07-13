import { Notice, Setting } from "obsidian";
import {
	BaseFormField,
	FormFieldFactory,
	FormFieldFactoryParams,
} from "./form-field.factory";
import {
	FORM_FIELD_ELEMENT_TYPE,
	FORM_FIELD_STATE,
} from "./form-field.constants";

export class TextFormFieldField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.TEXT;
}

export class TextFormFieldFactory extends FormFieldFactory {
	constructor(params: FormFieldFactoryParams) {
		super(params);
	}

	protected getSetting(): Setting {
		const setting = new Setting(this.contentEl)
			.setName(this.formField.name)
			.setClass(this.formField.className)
			.addText((text) => text.onChange(this.updateField.bind(this)));

		return setting;
	}

	protected getFormFieldHtmlPath(formField = this.formField): string {
		return `div.${formField.className} > div.setting-item-control > input`;
	}

	protected async assignValue(
		value?: string,
		updatedBy?: string
	): Promise<void> {
		if (
			(!value && updatedBy) ||
			(!value && this.formField.state === FORM_FIELD_STATE.CREATED)
		)
			value = this.formField.bypassValueExpressionEvaluation
				? this.formField.content.expression
				: await this.expressionEvaluator.evaluateExpression(
						this.formField.content?.expression,
						this.expressionContext
				  );

		if (value === this.formField.content.value) return;

		this.value = value ?? "";
	}

	set value(valueToSet: string) {
		if (typeof valueToSet === "object")
			valueToSet = JSON.stringify(valueToSet);

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
