import { Notice, Setting, SliderComponent } from "obsidian";
import {
	FORM_FIELD_ELEMENT_TYPE,
	FORM_FIELD_STATE,
} from "./form-field.constants";
import {
	BaseFormField,
	ExpressionProperty,
	FormFieldFactory,
	FormFieldFactoryParams,
} from "./form-field.factory";

export class RangeFormField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.RANGE;
	maxLimit: ExpressionProperty<number>;
	minLimit: ExpressionProperty<number>;
}

export class RangeFormFieldFactory extends FormFieldFactory {
	public formField: RangeFormField;
	private sliderComponent: SliderComponent;

	constructor(params: FormFieldFactoryParams) {
		super(params);
	}

	protected getSetting(): Setting {
		const setting = new Setting(this.contentEl)
			.setName(this.formField.name)
			.setClass(this.formField.className)
			.addSlider((slider) => (this.sliderComponent = slider));
		this.sliderComponent
			.setDynamicTooltip()
			.onChange(this.updateField.bind(this));

		return setting;
	}

	private async resolveSliderLimits() {
		const min = this.formField.bypassValueExpressionEvaluation
			? this.formField.maxLimit.expressionParams
			: await this.expressionEvaluator.evaluateExpression(
					this.formField.minLimit.expressionParams
			  );

		const max = this.formField.bypassValueExpressionEvaluation
			? this.formField.maxLimit.expressionParams
			: await this.expressionEvaluator.evaluateExpression(
					this.formField.maxLimit.expressionParams
			  );

		this.sliderComponent.setLimits(min, max, 1);
	}

	protected getFormFieldHtmlPath(): string {
		return `div.${this.formField.className} > div.setting-item-control > input`;
	}

	protected async assignValue(
		value?: string | number,
		updatedBy?: string
	): Promise<void> {
		await this.resolveSliderLimits();
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
