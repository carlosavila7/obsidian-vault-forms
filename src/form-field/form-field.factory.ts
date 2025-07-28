import { App, debounce, Setting } from "obsidian";
import {
	FORM_FIELD_ELEMENT_TYPE,
	FORM_FIELD_STATE,
} from "./form-field.constants";
import { ExpressionEvaluator } from "src/utils/expression-evaluator";

export class ExpressionProperty<T> {
	value: T | undefined;
	expressionParams?: {
		expression?: string;
		context?: FormFieldFactory[];
	};
}

export class BaseFormField {
	state?: FORM_FIELD_STATE;
	name: string;
	className: string;
	type: FORM_FIELD_ELEMENT_TYPE;
	description?: string;
	placeholder?: string;
	content: ExpressionProperty<string>;
	setting?: Setting;
	hideExpression?: string;
	required?: boolean;
	bypassValueExpressionEvaluation?: boolean;
}

export class FormFieldFactoryParams {
	contentEl: HTMLElement;
	app: App;
	formField: BaseFormField;
	hideExpressionContext?: FormFieldFactory[];
	bypassExpressionEvaluation?: boolean;
}

export abstract class FormFieldFactory {
	public readonly formField: BaseFormField;
	protected readonly contentEl: HTMLElement;
	protected readonly app: App;

	protected readonly hideExpressionContext?: FormFieldFactory[];
	protected baseRequiredValue?: boolean;
	protected expressionEvaluator: ExpressionEvaluator;
	protected dependentFields: { base: FormFieldFactory; update: () => void }[];

	private readonly debounceUpdateFieldTypes = [
		FORM_FIELD_ELEMENT_TYPE.TEXT,
		FORM_FIELD_ELEMENT_TYPE.NUMBER,
		FORM_FIELD_ELEMENT_TYPE.RANGE,
	];

	constructor(params: FormFieldFactoryParams) {
		this.contentEl = params.contentEl;
		this.app = params.app;
		this.formField = params.formField;
		this.baseRequiredValue = this.formField.required;
		this.hideExpressionContext = params?.hideExpressionContext;

		this.expressionEvaluator = new ExpressionEvaluator(this.app);

		this.formField.state = FORM_FIELD_STATE.CREATED;
	}

	protected abstract getSetting(): Setting;

	protected abstract getFormFieldHtmlPath(): string;

	protected abstract assignValue(
		value?: string,
		updatedBy?: string
	): Promise<void>;

	abstract set value(valueToSet: string);

	set setting(setting: Setting) {
		this.formField.setting = setting;

		this.assignFormFieldAttributes(setting);
	}

	set dependents(dependents: FormFieldFactory[]) {
		this.dependentFields = dependents.map((dependent) => {
			const update = () => {
				dependent.updateField(undefined, this.formField.className);
			};

			return {
				base: dependent,
				update: this.debounceUpdateFieldTypes.includes(
					this.formField.type
				)
					? debounce(update, 400)
					: update,
			};
		});
	}

	public async initialiseFormField(
		dependents: FormFieldFactory[]
	): Promise<void> {
		this.setting = this.getSetting();
		await this.assignDefaultValue();

		this.hideFormField(
			await this.expressionEvaluator.evaluateExpression<boolean>({
				expression: this.formField.hideExpression,
				context: this.hideExpressionContext,
			})
		);
		this.dependents = dependents;
		this.formField.state = FORM_FIELD_STATE.INITIALIZED;
	}

	protected async assignDefaultValue(): Promise<void> {
		await this.assignValue();
	}

	protected async updateField(
		value?: string,
		updatedBy?: string
	): Promise<void> {
		console.debug(`${this.formField.className} changed: ${value}`);

		await this.assignValue(value, updatedBy);

		this.hideFormField(
			await this.expressionEvaluator.evaluateExpression<boolean>({
				expression: this.formField.hideExpression,
				context: this.hideExpressionContext,
			})
		);
		await Promise.all(
			this.dependentFields?.map((dependent) => dependent.update())
		);
	}

	protected assignFormFieldAttributes(setting: Setting): void {
		const htmlEl = this.contentEl.querySelector(
			this.getFormFieldHtmlPath()
		);

		htmlEl?.setAttribute("type", this.formField.type);

		if (this.formField.placeholder)
			htmlEl?.setAttribute("placeholder", this.formField.placeholder);

		if (this.formField.description)
			setting.setDesc(this.formField.description);
	}

	protected hideFormField(hide: boolean): void {
		this.formField.required =
			hide === true ? false : this.baseRequiredValue;

		const fieldEl = this.contentEl.querySelector(
			this.getFormFieldHtmlPath()
		);

		const displayType = hide ? "none" : "";

		fieldEl?.parentElement?.parentElement?.setAttr(
			"style",
			`display:${displayType}`
		);
	}
}
