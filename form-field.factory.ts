import {
	DropdownFormField,
	FORM_FIELD_ELEMENT_TYPE,
	FORM_FIELD_STATE,
	FormField,
} from "form";
import { App, Notice, Setting } from "obsidian";
import {
	fromArrayToRecord,
	getClassNamesFromExpression,
	getFilePathsFromExpression,
} from "utils";

abstract class FormFieldFactory {
	public readonly formField: FormField;
	protected readonly contentEl: HTMLElement;
	protected readonly app: App;

	protected readonly expressionContext?: FormFieldFactory[];
	protected dependentFields: FormFieldFactory[];

	constructor(params: {
		contentEl: HTMLElement;
		app: App;
		formField: FormField;
		expressionContext?: FormFieldFactory[];
	}) {
		this.contentEl = params.contentEl;
		this.app = params.app;
		this.formField = params.formField;
		this.expressionContext = params?.expressionContext;

		this.formField.state = FORM_FIELD_STATE.CREATED;
	}

	protected abstract getSetting(): Setting;

	abstract set value(valueToSet: string);

	set dependents(dependents: FormFieldFactory[]) {
		this.dependentFields = dependents;
	}

	public async initialiseFormField(
		dependents: FormFieldFactory[]
	): Promise<void> {
		this.formField.setting = this.getSetting();
		await this.assignDefaultValue();

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
		new Notice(`${this.formField.className} changed: ${value}`);

		await this.assignValue(value, updatedBy);

		await Promise.all(
			this.dependentFields?.map((dependent) =>
				dependent.updateField(undefined, this.formField.className)
			)
		);
	}

	protected async assignValue(
		value?: string,
		updatedBy?: string
	): Promise<void> {
		const valueToAssing = value
			? value
			: await this.evaluateExpression(
					this.formField.content?.expression,
					this.expressionContext
			  );

		if (valueToAssing === this.formField.content.value) return;

		this.value = valueToAssing;
	}

	protected assignFormFieldAttributes(setting: Setting): void {
		const htmlEl = this.contentEl.querySelector(
			this.getFormFieldHtmlPath()
		);

		htmlEl?.setAttribute("type", this.formField.type);

		if (this.formField.placeholder)
			htmlEl?.setAttribute("placeholder", this.formField?.placeholder);

		if (this.formField.description)
			setting.setDesc(this.formField.description);
	}

	protected getFormFieldHtmlPath(formField = this.formField): string {
		return `div.${formField.className} > div.setting-item-control > input`;
	}

	protected async evaluateExpression(
		expression?: string,
		expressionContext?: FormFieldFactory[]
	): Promise<string> {
		if (!this.formField.content.expression) return "";

		const [prefix, expressionToEvaluate, sufix] = expression
			? this.splitExpression(expression)
			: ["", "", ""];

		if (!expressionToEvaluate) return prefix;

		const parsedExpression = await this.parseExpressionContext(
			expressionToEvaluate,
			expressionContext
		);

		try {
			const expressionResult = new Function(
				`return ${parsedExpression};`
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

	protected splitExpression(expression: string): string[] {
		if (!(expression.includes("{{") && expression.includes("}}")))
			return [expression];

		const expressionMatcher = new RegExp(/{{(.*)}}/);

		const expressionToEvaluate = expressionMatcher.exec(expression)?.at(0);

		const prefix = expression.split("{{")[0];
		const sufix = expression.split("}}")[1];

		return [prefix, expressionToEvaluate ?? "", sufix];
	}

	protected async parseExpressionContext(
		expression: string,
		expressionContext?: FormFieldFactory[]
	): Promise<string> {
		const formFieldClassNames = getClassNamesFromExpression(expression);

		formFieldClassNames.forEach((formFieldClassName) => {
			const formField = expressionContext?.find(
				(formField) =>
					formField.formField.className === formFieldClassName
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

		const expressionContentMatcher = new RegExp(/{{(.*)}}/);

		return expressionContentMatcher.exec(expression)?.at(-1) ?? "";
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

export class TimeFormFieldFactory extends TextFormFieldFactory {
	protected async assignValue(
		value?: string,
		updatedBy?: string
	): Promise<void> {
		let valueToAssing = value
			? value
			: await this.evaluateExpression(
					this.formField.content?.expression,
					this.expressionContext
			  );

		let [hour, minute] = valueToAssing.split(":");

		if (!hour || !minute) {
			new Notice(`Unexpected format for time field. Expected is HH:mm`);
			return;
		}

		hour = hour.length === 2 ? hour : `0${hour}`;
		minute = minute.length === 2 ? minute : `0${minute}`;

		valueToAssing = `${hour}:${minute}`;

		if (valueToAssing === this.formField.content.value) return;

		this.value = valueToAssing;
	}
}
export class DropdownFormFieldFactory extends FormFieldFactory {
	formField: DropdownFormField;
	optionExpressionContext?: FormFieldFactory[];
	constructor(params: {
		contentEl: HTMLElement;
		app: App;
		formField: FormField;
		expressionContext: FormFieldFactory[];
		optionExpressionContext?: FormFieldFactory[];
	}) {
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

		const parsedExpression = await this.parseExpressionContext(
			expressionToEvaluate,
			this.optionExpressionContext
		);

		try {
			const newOptions: string[] = new Function(
				`return ${parsedExpression};`
			)();

			this.addNewOptions.bind(this)(newOptions, updatedBy, false, true);
		} catch (error) {
			new Notice(
				`error on evaluating ${this.formField.className} option expression`
			);
			console.error(error);
		}
	}

	protected async assignValue(
		value?: string,
		updatedBy?: string
	): Promise<void> {
		await this.resolveDropdownOptions(updatedBy);

		const valueToAssing = value
			? value
			: (await this.evaluateExpression(
					this.formField.content.expression,
					this.expressionContext
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

export class Form {
	private contentEl: HTMLElement;
	private app: App;

	private formFieldFactories: FormFieldFactory[] = [];
	private formFields: FormField[];

	constructor(contentEl: HTMLElement, app: App, formFields: FormField[]) {
		this.contentEl = contentEl;
		this.app = app;
		this.formFields = formFields;
	}

	public async createFormFields(): Promise<void> {
		this.formFields.forEach((formField) => {
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
				case FORM_FIELD_ELEMENT_TYPE.NUMBER:
					this.formFieldFactories.push(
						new TextFormFieldFactory(factoryParams)
					);
					break;
				case FORM_FIELD_ELEMENT_TYPE.TIME:
					this.formFieldFactories.push(
						new TimeFormFieldFactory(factoryParams)
					);
					break;
				case FORM_FIELD_ELEMENT_TYPE.DROPDOWN:
					this.formFieldFactories.push(
						new DropdownFormFieldFactory({
							optionExpressionContext: this.getExpressionContext(
								(formField as DropdownFormField).options
									.expression
							),
							...factoryParams,
						})
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
		return formFieldFactories.filter(
			(factory) =>
				factory.formField.content?.expression?.includes(
					`$$.${fieldClassName}`
				) ||
				(
					factory.formField as DropdownFormField
				).options?.expression?.includes(`$$.${fieldClassName}`)
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

	public getDataAsFrontmatter(): string {
		let frontmatterString = "";
		this.formFieldFactories.map((factory) => {
			const stringValue =
				factory.formField.type === FORM_FIELD_ELEMENT_TYPE.DROPDOWN ||
				factory.formField.type === FORM_FIELD_ELEMENT_TYPE.TEXT
					? `"${factory.formField.content?.value ?? ""}"`
					: factory.formField.content?.value;

			frontmatterString += `${factory.formField.className}: ${stringValue}\n`;
		});

		return `---\n${frontmatterString}---`;
	}

	public getTimestampNamingStrategy(): string {
		const date = this.formFieldFactories.find(
			(factory) => factory.formField.className === "date"
		)?.formField.content.value;

		const time = this.formFieldFactories.find(
			(factory) => factory.formField.className === "time"
		)?.formField.content.value;

		const expenseTime = new Date(`${date} ${time}`).getTime();
		const currentMilliseconds = new Date().getMilliseconds();
		return (expenseTime + currentMilliseconds).toString(36);
	}

	public setFormDataNull(): void {
		this.formFieldFactories.forEach(
			(factory) => (factory.formField.content.value = undefined)
		);
	}
}
