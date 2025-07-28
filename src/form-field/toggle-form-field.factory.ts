import { Notice, Setting } from "obsidian";
import {
	FORM_FIELD_ELEMENT_TYPE,
	FORM_FIELD_STATE,
} from "./form-field.constants";
import {
	BaseFormField,
	FormFieldFactory,
	FormFieldFactoryParams,
} from "./form-field.factory";

export class ToggleFormField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.TOGGLE;
}

export class ToggleFormFieldFactory extends FormFieldFactory {
	constructor(params: FormFieldFactoryParams) {
		super(params);
	}

	protected getSetting(): Setting {
		const setting = new Setting(this.contentEl)
			.setName(this.formField.name)
			.setClass(this.formField.className)
			.addToggle((toggle) =>
				toggle.onChange((value: boolean) =>
					this.updateField.bind(this)(`${value}`)
				)
			);

		return setting;
	}

	protected getFormFieldHtmlPath(): string {
		return `div.${this.formField.className} > div.setting-item-control > div`;
	}

	protected async assignValue(
		value?: string,
		updatedBy?: string
	): Promise<void> {
		if (
			(!value && updatedBy) ||
			(!value && this.formField.state === FORM_FIELD_STATE.CREATED)
		)
			if (this.formField.bypassValueExpressionEvaluation)
				value = this.formField.content.expressionParams?.expression;
			else {
				const expressionResult =
					await this.expressionEvaluator.evaluateExpression<
						string | boolean
					>(this.formField.content?.expressionParams);

				value =
					typeof expressionResult === "string"
						? this.handleExpressionResult(expressionResult)
						: `${expressionResult}`;
			}

		if (value === this.formField.content.value) return;

		this.value = value ?? "";
	}

	set value(valueToSet: string) {
		const fieldEl = this.contentEl.querySelector(
			this.getFormFieldHtmlPath()
		);
		if (fieldEl instanceof HTMLDivElement) {
			if (valueToSet.toLocaleLowerCase() === "true")
				fieldEl.addClass("is-enabled");
			else fieldEl.removeClass("is-enabled");

			this.formField.content["value"] = valueToSet;
		} else
			new Notice(
				`Can't find field element: ${this.getFormFieldHtmlPath()}`
			);
	}

	private handleExpressionResult(expressionResult: string): string {
		expressionResult = expressionResult.toLowerCase().trim();

		if (expressionResult === "true" || expressionResult === "false")
			return expressionResult.toLocaleLowerCase().trim();
		else return "false";
	}
}
