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
	description?: ExpressionProperty<string>;
	placeholder?: ExpressionProperty<string>;
	content: ExpressionProperty<string>;
	setting?: Setting;
	hideExpression?: ExpressionProperty<boolean>;
	required?: boolean;
	bypassValueExpressionEvaluation?: boolean;
	disable?: boolean;
	writeToOutputNote?: boolean;
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
		this.formField.setting = this.getSetting();
		await this.assignDefaultValue();

		this.hideFormField(
			await this.expressionEvaluator.evaluateExpression<boolean>(
				this.formField.hideExpression?.expressionParams
			)
		);
		await this.assignFormFieldAttributes();

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
			await this.expressionEvaluator.evaluateExpression<boolean>(
				this.formField.hideExpression?.expressionParams
			)
		);

		const htmlEl = this.contentEl.querySelector(
			this.getFormFieldHtmlPath()
		);

		if (!htmlEl)
			throw new Error(
				`Can't find ${this.formField.className} html element`
			);

		await this.assignPlaceholder(htmlEl, updatedBy);
		await this.assignDescription(updatedBy);

		await Promise.all(
			this.dependentFields?.map((dependent) => dependent.update())
		);
	}

	protected async assignFormFieldAttributes(): Promise<void> {
		const htmlEl = this.contentEl.querySelector(
			this.getFormFieldHtmlPath()
		);

		if (!htmlEl) return;

		htmlEl.setAttribute("type", this.formField.type);

		if (htmlEl) await this.assignPlaceholder(htmlEl);

		if (this.formField.description) await this.assignDescription();
		// this.formField.setting?.setDesc(this.formField.description);
	}

	protected async assignDescription(updatedBy?: string) {
		if (!updatedBy && this.formField.state === FORM_FIELD_STATE.INITIALIZED)
			return;

		let description = this.formField.description?.value ?? "";

		if (this.formField.description?.expressionParams)
			description = this.formField.bypassValueExpressionEvaluation
				? this.formField.description?.expressionParams?.expression
				: await this.expressionEvaluator.evaluateExpression<string>(
						this.formField.description?.expressionParams
				  );
		this.formField.setting?.setDesc(description);
	}

	protected async assignPlaceholder(htmlEl: Element, updatedBy?: string) {
		if (!updatedBy && this.formField.state === FORM_FIELD_STATE.INITIALIZED)
			return;

		let placeholder = this.formField.placeholder?.value ?? "";

		if (this.formField.placeholder?.expressionParams)
			placeholder = this.formField.bypassValueExpressionEvaluation
				? this.formField.placeholder?.expressionParams?.expression
				: await this.expressionEvaluator.evaluateExpression<string>(
						this.formField.placeholder?.expressionParams
				  );

		htmlEl.setAttribute("placeholder", placeholder);
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
