import { DropdownFormField, FORM_FIELD_ELEMENT_TYPE, FormField } from "form";
import { Notice, Setting } from "obsidian";
import { getClassNamesFromExpression } from "utils";

abstract class FormFieldFactory {
	public readonly formField: FormField;
	protected readonly contentEl: HTMLElement;

	protected readonly expressionContext: FormFieldFactory[];
	protected dependentFields: FormFieldFactory[];

	constructor(params: {
		contentEl: HTMLElement;
		formField: FormField;
		expressionContext: FormFieldFactory[];
	}) {
		this.contentEl = params.contentEl;
		this.formField = params.formField;
		this.expressionContext = params.expressionContext;

		this.initialiseFormField();
		this.assignDefaultValue();
	}

	abstract get setting(): Setting;

	abstract set value(valueToSet: string);

	set dependents(dependents: FormFieldFactory[]) {
		this.dependentFields = dependents;
	}

	public initialiseFormField(): void {
		this.formField.setting = this.setting;
	}

	public assignDefaultValue(): void {
		this.assignValue();
	}

	protected updateField(value: string) {
		new Notice(`${this.formField.className} changed: ${value}`);

		this.value = value;

		this.dependentFields?.forEach((dependent) => dependent.assignValue());

		console.log(`${this.formField.className} UPDATED`, this.formField);
	}

	protected assignValue(value?: string) {
		const valueToAssing = value ? value : this.evaluateExpression();

		if (valueToAssing === this.formField.content.value) return;

		this.value = valueToAssing;
	}

	protected assignFormFieldAttributes(setting: Setting): void {
		const htmlEl = this.contentEl.querySelector(
			this.getFormFieldHtmlPath()
		);

		htmlEl?.setAttribute("type", this.formField.type);

		if (this.formField.description)
			setting.setDesc(this.formField.description);
	}

	protected getFormFieldHtmlPath(formField = this.formField): string {
		return `div.${formField.className} > div.setting-item-control > input`;
	}

	protected evaluateExpression(): string {
		if (!this.formField.content.expression) return "";

		const [prefix, expressionToEvaluate, sufix] = this.splitExpression(
			this.formField.content.expression
		);

		if (!expressionToEvaluate) return prefix;

		const parsedExpression =
			this.parseExpressionContext(expressionToEvaluate);

		try {
			const expressionResult = new Function(
				`return ${parsedExpression}`
			)();

			return `${prefix}${expressionResult}${sufix ?? ""}`;
		} catch (error) {
			new Notice(
				`Error on evaluating ${this.formField.className} expression`
			);
			console.error(error);

			return `${prefix}${sufix ?? ""}`;
		}
	}

	private splitExpression(expression: string): string[] {
		if (!(expression.includes("{{") && expression.includes("}}")))
			return [expression];

		const expressionMatcher = new RegExp(/{{(.*)}}/);

		const expressionToEvaluate = expressionMatcher.exec(expression)?.at(-1);

		const prefix = expression.split("{{")[0];
		const sufix = expression.split("}}")[1];

		return [prefix, expressionToEvaluate ?? "", sufix];
	}

	private parseExpressionContext(expression: string): string {
		const formFieldClassNames = getClassNamesFromExpression(expression);

		formFieldClassNames.forEach((formFieldClassName) => {
			const formField = this.expressionContext?.find(
				(formField) =>
					formField.formField.className === formFieldClassName
			);

			const classNameMatcher = new RegExp(
				`\\$\\$\\.${formField?.formField.className}`
			);

			expression = expression.replace(
				classNameMatcher,
				`'${formField?.formField?.content?.value ?? ""}'`
			);
		});

		return expression;
	}
}

export class TextFormFieldFactory extends FormFieldFactory {
	constructor(params: {
		contentEl: HTMLElement;
		formField: FormField;
		expressionContext: FormFieldFactory[];
	}) {
		super(params);
	}

	get setting(): Setting {
		const setting = new Setting(this.contentEl)
			.setName(this.formField.name)
			.setClass(this.formField.className)
			.addText((text) => text.onChange(this.updateField.bind(this)));

		this.assignFormFieldAttributes(setting);

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

export class DropdownFormFieldFactory extends FormFieldFactory {
	formField: DropdownFormField;
	constructor(params: {
		contentEl: HTMLElement;
		formField: FormField;
		expressionContext: FormFieldFactory[];
	}) {
		super(params);
	}

	get setting(): Setting {
		const setting = new Setting(this.contentEl)
			.setName(this.formField.name)
			.setClass(this.formField.className)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(this.formField.options)
					.onChange(this.updateField.bind(this))
			);

		this.assignFormFieldAttributes(setting);

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

	protected assignValue(value?: string): void {
		const valueToAssing = value ? value : this.evaluateExpression();

		if (
			valueToAssing === this.formField.content.value ||
			valueToAssing === ""
		)
			return;

		const formFieldHtmlPath = this.getFormFieldHtmlPath();
		const fieldEl = this.contentEl.querySelector(
			this.getFormFieldHtmlPath()
		);

		const postAddedOption = this.contentEl?.querySelector(
			`${formFieldHtmlPath} > option.post-added-option`
		);

		if (postAddedOption) fieldEl?.removeChild(postAddedOption);

		fieldEl
			?.createEl("option", { value: valueToAssing, text: valueToAssing })
			.setAttr("class", "post-added-option");

		this.value = valueToAssing;
	}
}

export class Form {
	contentEl: HTMLElement;

	formFieldFactories: FormFieldFactory[] = [];

	constructor(contentEl: HTMLElement, formFields: FormField[]) {
		this.contentEl = contentEl;

		this.createFormFields(formFields);
	}

	createFormFields(formFields: FormField[]): void {
		formFields.forEach((formField) => {
			if (formField.setting) formField.setting.clear();

			const factoryParams = {
				formField,
				contentEl: this.contentEl,
				expressionContext: this.getExpressionContext(
					formField.content?.expression
				),
			};

			switch (formField.type) {
				case FORM_FIELD_ELEMENT_TYPE.TEXT:
				case FORM_FIELD_ELEMENT_TYPE.DATE:
				case FORM_FIELD_ELEMENT_TYPE.TIME:
					this.formFieldFactories.push(
						new TextFormFieldFactory(factoryParams)
					);
					break;
				case FORM_FIELD_ELEMENT_TYPE.DROPDOWN:
					this.formFieldFactories.push(
						new DropdownFormFieldFactory(factoryParams)
					);
					break;
			}
		});

		this.formFieldFactories.forEach((factory, _, factories) => {
			factory.dependents = this.getDependentFields(
				factory.formField.className,
				factories
			);
		});
	}

	private getDependentFields(
		fieldClassName: string,
		formFieldFactories: FormFieldFactory[]
	): FormFieldFactory[] {
		return formFieldFactories.filter((factory) =>
			factory.formField.content?.expression?.includes(
				`$$.${fieldClassName}`
			)
		);
	}

	private getExpressionContext(expression?: string): FormFieldFactory[] {
		const expressionContext: FormFieldFactory[] = [];

		if (!expression) return expressionContext;

		const formFieldClassNames = getClassNamesFromExpression(expression);

		formFieldClassNames.forEach((formFieldClassName) => {
			const partialContext = this.formFieldFactories.find(
				(formFieldFactory) =>
					formFieldFactory.formField.className === formFieldClassName
			);

			if (partialContext) expressionContext.push(partialContext);
		});

		return expressionContext;
	}
}
