import {
	BaseFormField,
	FormFieldFactory,
	FormFieldFactoryParams,
} from "./form-field.factory";
import { Notice, Setting } from "obsidian";
import { fromArrayToRecord } from "utils";
import {
	FORM_FIELD_ELEMENT_TYPE,
	FORM_FIELD_STATE,
} from "./form-field.constants";

class DropdownOptions {
	value?: string[];
	expression?: string;
}

export class DropdownFormField extends BaseFormField {
	type = FORM_FIELD_ELEMENT_TYPE.DROPDOWN;
	options: DropdownOptions;
}

export class DropdownFormFieldFactoryParams extends FormFieldFactoryParams {
	optionExpressionContext?: FormFieldFactory[];
}

export class DropdownFormFieldFactory extends FormFieldFactory {
	formField: DropdownFormField;
	optionExpressionContext?: FormFieldFactory[];
	constructor(params: DropdownFormFieldFactoryParams) {
		super(params);
		this.optionExpressionContext = params.optionExpressionContext;
	}

	protected getSetting(): Setting {
		const options = fromArrayToRecord(this.formField.options.value);
		const setting = new Setting(this.contentEl)
			.setName(this.formField.name)
			.setClass(this.formField.className)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(options)
					.onChange(this.updateField.bind(this))
			);

		this.assignFormFieldAttributes(setting);
		this.hideFormField(false);
		return setting;
	}

	set value(valueToSet: string) {
		const fieldEl = this.contentEl.querySelector(
			this.getFormFieldHtmlPath()
		);

		if (fieldEl instanceof HTMLSelectElement) {
			fieldEl.value = valueToSet;
			this.formField.content["value"] = valueToSet;
		} else
			new Notice(
				`Can't find field element: ${this.getFormFieldHtmlPath()}`
			);
	}

	protected getFormFieldHtmlPath(formField = this.formField): string {
		return `div.${formField.className} > div.setting-item-control > select`;
	}

	private async resolveDropdownOptions(
		updatedBy: string = this.formField.className
	): Promise<void> {
		const expressionToEvaluate = this.formField.options?.expression;

		if (
			!expressionToEvaluate ||
			(this.formField.state === FORM_FIELD_STATE.INITIALIZED &&
				!expressionToEvaluate.includes(updatedBy))
		)
			return;

		const options = await this.expressionEvaluator.evaluateExpression<
			string[]
		>({
			expression: expressionToEvaluate,
			context: this.optionExpressionContext,
		});

		this.addNewOptions(options, updatedBy, false, true);
	}

	protected async assignValue(
		value?: string,
		updatedBy?: string
	): Promise<void> {
		await this.resolveDropdownOptions(updatedBy);

		const valueToAssing = value
			? value
			: (await this.expressionEvaluator.evaluateExpression(
					this.formField.content.expressionParams
			  )) || Object.values(this.formField.options?.value ?? {})[0];

		if (
			valueToAssing === this.formField.content.value ||
			valueToAssing === ""
		)
			return;

		if (
			this.formField.options.value &&
			!Object.values(this.formField.options.value).includes(valueToAssing)
		)
			this.addNewOptions([valueToAssing], updatedBy, !!updatedBy);

		this.value = valueToAssing;
	}

	private addNewOptions(
		newOptions: string[],
		updatedBy: string = this.formField.className,
		keepOnlyOneByUpdatedField: boolean = true,
		removeOldOptions: boolean = false
	): void {
		if (!newOptions.length) return;

		const formFieldHtmlPath = this.getFormFieldHtmlPath();
		const fieldEl = this.contentEl.querySelector(
			this.getFormFieldHtmlPath()
		);

		if (!fieldEl) return;

		if (removeOldOptions) {
			fieldEl.innerHTML = "";

			this.formField.options.value = newOptions;
		}

		newOptions.forEach((newOption) => {
			const postAddedOption = keepOnlyOneByUpdatedField
				? this.contentEl?.querySelector(
						`${formFieldHtmlPath} > option.${updatedBy}`
				  )
				: undefined;

			if (postAddedOption && keepOnlyOneByUpdatedField)
				fieldEl.removeChild(postAddedOption);

			fieldEl
				.createEl("option", {
					value: newOption,
					text: newOption,
				})
				.setAttr("class", updatedBy);

			this.formField.options.value = this.formField.options.value
				? [...this.formField.options.value, newOption]
				: [newOption];
		});
	}
}
