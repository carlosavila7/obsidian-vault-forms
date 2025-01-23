import { App, Notice, Setting } from "obsidian";
import { getClassNamesFromExpression, getFilePathsFromExpression } from "utils";
import { FORM_FIELD_ELEMENT_TYPE, FORM_FIELD_STATE } from "./form-field.constants";

class FormFieldContent {
	expression?: string;
	value?: string;
}

export class BaseFormField {
	state?: FORM_FIELD_STATE;
	name: string;
	className: string;
	type: FORM_FIELD_ELEMENT_TYPE;
	description?: string;
	placeholder?: string;
	content: FormFieldContent;
	setting?: Setting;
}

export abstract class FormFieldFactory {
	public readonly formField: BaseFormField;
	protected readonly contentEl: HTMLElement;
	protected readonly app: App;

	protected readonly expressionContext?: FormFieldFactory[];
	protected dependentFields: FormFieldFactory[];

	constructor(params: {
		contentEl: HTMLElement;
		app: App;
		formField: BaseFormField;
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

	set setting(setting: Setting) {
		this.formField.setting = setting;

		this.assignFormFieldAttributes(setting);
	}

	set dependents(dependents: FormFieldFactory[]) {
		this.dependentFields = dependents;
	}

	public async initialiseFormField(
		dependents: FormFieldFactory[]
	): Promise<void> {
		this.setting = this.getSetting();
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
			htmlEl?.setAttribute("placeholder", this.formField.placeholder);

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
