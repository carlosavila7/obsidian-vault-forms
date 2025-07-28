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

class RangeOptions {
	min: number;
	max: number;
}

export class RangeFormField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.RANGE;
	options: RangeOptions;
}

export class RangeFormFieldFactory extends FormFieldFactory {
	public formField: RangeFormField;

	constructor(params: FormFieldFactoryParams) {
		super(params);
	}

	protected getSetting(): Setting {
		const setting = new Setting(this.contentEl)
			.setName(this.formField.name)
			.setClass(this.formField.className)
			.addSlider((slider) =>
				slider
					.setDynamicTooltip()
					.setLimits(
						this.formField.options.min,
						this.formField.options.max,
						1
					)
					.onChange(this.updateField.bind(this))
			);

		return setting;
	}

	protected getFormFieldHtmlPath(): string {
		return `div.${this.formField.className} > div.setting-item-control > input`;
	}

	protected async assignValue(
		value?: string | number,
		updatedBy?: string
	): Promise<void> {
		let valueAsString = value?.toString();
		if (
			(!valueAsString && updatedBy) ||
			(!valueAsString &&
				this.formField.state === FORM_FIELD_STATE.CREATED)
		)
			if (this.formField.bypassValueExpressionEvaluation)
				valueAsString =
					this.formField.content.expressionParams?.expression;
			else {
				const expressionResult =
					await this.expressionEvaluator.evaluateExpression<
						string | boolean
					>(this.formField.content?.expressionParams);

				valueAsString = expressionResult;
			}

		if (valueAsString === this.formField.content.value) return;

		this.value = valueAsString ?? "";
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
