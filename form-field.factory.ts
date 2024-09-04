import { DropdownFormField, FORM_FIELD_ELEMENT_TYPE, FormField } from "form";
import { App, Notice, Setting } from "obsidian";
import { getClassNamesFromExpression, getFilePathsFromExpression } from "utils";

abstract class FormFieldFactory {
	public readonly formField: FormField;
	protected readonly contentEl: HTMLElement;
	protected readonly app: App;

	protected readonly expressionContext: FormFieldFactory[];
	protected dependentFields: FormFieldFactory[];

	constructor(params: {
		contentEl: HTMLElement;
		app: App;
		formField: FormField;
		expressionContext: FormFieldFactory[];
	}) {
		this.contentEl = params.contentEl;
		this.app = params.app;
		this.formField = params.formField;
		this.expressionContext = params.expressionContext;
	}

	protected abstract getSetting(): Setting;

	abstract set value(valueToSet: string);

	set dependents(dependents: FormFieldFactory[]) {
		this.dependentFields = dependents;
	}

	public async initialiseFormField(
		dependents: FormFieldFactory[]
	): Promise<void> {
		console.log(
			`[initializeFormField] ${this.formField.className.toUpperCase()} dependents: ${
				this.dependents
			}`
		);
		this.getSetting().then((value) => (this.formField.setting = value));
		await this.assignDefaultValue();
		this.dependents = dependents;
	}

	protected async assignDefaultValue(): Promise<void> {
		await this.assignValue();
	}

	protected async updateField(value?: string): Promise<void> {
		new Notice(`${this.formField.className} changed: ${value}`);

		await this.assignValue(value)

		await Promise.all(
			this.dependentFields?.map((dependent) =>
				dependent.updateField()
			)
		);

		console.log(
			`[updateField] ${this.formField.className.toUpperCase()} formField: ${JSON.stringify(
				this.formField.content.value
			)}`
		);
	}

	protected async assignValue(value?: string): Promise<void> {
		const valueToAssing = value ? value : await this.evaluateExpression();

		if (valueToAssing === this.formField.content.value) return;

		console.log(
			`[assignValue] ${this.formField.className.toUpperCase()} valueToAssing: ${valueToAssing}`
		);
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

	protected async evaluateExpression(): Promise<string> {
		if (!this.formField.content.expression) return "";

		const [prefix, expressionToEvaluate, sufix] = this.splitExpression(
			this.formField.content.expression
		);

		if (!expressionToEvaluate) return prefix;

		const parsedExpression = await this.parseExpressionContext(
			expressionToEvaluate
		);
		console.log(
			`[evaluateExpression] ${this.formField.className.toUpperCase()} parsedExpression: ${parsedExpression}`
		);

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

	private async parseExpressionContext(expression: string): Promise<string> {
		const formFieldClassNames = getClassNamesFromExpression(expression);

		console.log(
			`[parseExpressionContext] ${this.formField.className.toUpperCase()} expression: ${expression}`
		);
		console.log(
			`[parseExpressionContext] ${this.formField.className.toUpperCase()} classNames: ${formFieldClassNames}`
		);

		formFieldClassNames.forEach((formFieldClassName) => {
			const formField = this.expressionContext?.find(
				(formField) =>
					formField.formField.className === formFieldClassName
			);

			console.log(
				`[parseExpressionContext] ${this.formField.className.toUpperCase()} ${formFieldClassName}: ${
					formField?.formField?.content?.value
				}`
			);

			const classNameMatcher = new RegExp(
				`\\$\\$\\.${formField?.formField.className}`
			);

			const isFilePath = new RegExp(
				`%%.*\\$\\$\\.${formField?.formField.className}.*%%`,
				"g"
			);

			const valueTeReplace = isFilePath.test(expression)
				? `${formField?.formField?.content?.value ?? ""}`
				: `'${formField?.formField?.content?.value ?? ""}'`;

			expression = expression.replace(classNameMatcher, valueTeReplace);
		});

		const filePaths = getFilePathsFromExpression(expression);

		console.log(
			`[parseExpressionContext] ${this.formField.className.toUpperCase()} filePaths: ${filePaths}`
		);
		await Promise.all(
			filePaths.map(async (filePath) => {
				const filePathMatcher = new RegExp(`%%${filePath}%%`);

				const [_, fileExtension] = filePath.split(".");

				if (fileExtension !== "md") {
					new Notice(
						`Can't handle .${fileExtension} extension, .md expected`
					);

					expression = expression.replace(filePathMatcher, "");
				}

				const file = this.app.vault.getFileByPath(filePath);

				if (!file) return;

				let fileFrontMatter = "";
				await this.app.fileManager.processFrontMatter(
					file,
					(frontmatter) => (fileFrontMatter = frontmatter)
				);

				expression = expression.replace(
					filePathMatcher,
					JSON.stringify(fileFrontMatter)
				);
			})
		);

		return expression;
	}
}

export class TextFormFieldFactory extends FormFieldFactory {
	constructor(params: {
		contentEl: HTMLElement;
		app: App;
		formField: FormField;
		expressionContext: FormFieldFactory[];
	}) {
		super(params);
	}

	protected getSetting(): Setting {
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
		app: App;
		formField: FormField;
		expressionContext: FormFieldFactory[];
	}) {
		super(params);
	}

	protected getSetting(): Setting {
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

	protected async assignValue(value?: string): Promise<void> {
		const valueToAssing = value
			? value
			: this.formField.content.expression
			? await this.evaluateExpression()
			: Object.values(this.formField.options)[0];

		if (
			valueToAssing === this.formField.content.value ||
			valueToAssing === ""
		)
			return;

		if (!Object.values(this.formField.options).includes(valueToAssing)) {
			const formFieldHtmlPath = this.getFormFieldHtmlPath();
			const fieldEl = this.contentEl.querySelector(
				this.getFormFieldHtmlPath()
			);

			const postAddedOption = this.contentEl?.querySelector(
				`${formFieldHtmlPath} > option.post-added-option`
			);

			if (postAddedOption) fieldEl?.removeChild(postAddedOption);

			fieldEl
				?.createEl("option", {
					value: valueToAssing,
					text: valueToAssing,
				})
				.setAttr("class", "post-added-option");
		}

		this.value = valueToAssing;
	}
}

export class Form {
	contentEl: HTMLElement;
	app: App;

	formFieldFactories: FormFieldFactory[] = [];

	constructor(contentEl: HTMLElement, app: App, formFields: FormField[]) {
		this.contentEl = contentEl;
		this.app = app;
		this.createFormFields(formFields);
	}

	async createFormFields(formFields: FormField[]): Promise<void> {
		formFields.forEach((formField) => {
			if (formField.setting) formField.setting.clear();

			const factoryParams = {
				formField,
				app: this.app,
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

		for (const factory of this.formFieldFactories) {
			await factory.initialiseFormField(
				this.getDependentFields(
					factory.formField.className,
					this.formFieldFactories
				)
			);
		}
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
