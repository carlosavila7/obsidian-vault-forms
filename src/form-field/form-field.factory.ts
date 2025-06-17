import { App, Notice, Setting } from "obsidian";
import { getClassNamesFromExpression, getFilePathsFromExpression } from "utils";
import {
	FORM_FIELD_ELEMENT_TYPE,
	FORM_FIELD_STATE,
} from "./form-field.constants";

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
	hideExpression?: string;
	required?: boolean;
	bypassValueExpressionEvaluation?: boolean;
}

export class FormFieldFactoryParams {
	contentEl: HTMLElement;
	app: App;
	formField: BaseFormField;
	expressionContext?: FormFieldFactory[];
	hideExpressionContext?: FormFieldFactory[];
	bypassExpressionEvaluation?: boolean;
}

export abstract class FormFieldFactory {
	public readonly formField: BaseFormField;
	protected readonly contentEl: HTMLElement;
	protected readonly app: App;

	protected readonly expressionContext?: FormFieldFactory[];
	protected readonly hideExpressionContext?: FormFieldFactory[];
	protected dependentFields: FormFieldFactory[];

	constructor(params: FormFieldFactoryParams) {
		this.contentEl = params.contentEl;
		this.app = params.app;
		this.formField = params.formField;
		this.expressionContext = params?.expressionContext;
		this.hideExpressionContext = params?.hideExpressionContext;

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
		this.dependentFields = dependents;
	}

	public async initialiseFormField(
		dependents: FormFieldFactory[]
	): Promise<void> {
		this.setting = this.getSetting();
		await this.assignDefaultValue();
		this.hideFormField(
			await this.evaluateExpression<boolean>(
				this.formField.hideExpression,
				this.hideExpressionContext
			)
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
			await this.evaluateExpression<boolean>(
				this.formField.hideExpression,
				this.hideExpressionContext
			)
		);
		await Promise.all(
			this.dependentFields?.map((dependent) =>
				dependent.updateField(undefined, this.formField.className)
			)
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

	protected async evaluateExpression<T>(
		expression?: string,
		expressionContext?: FormFieldFactory[]
	): Promise<T | any> {
		if (!expression) return "";

		const [prefix, expressionToEvaluate, sufix] =
			expression.includes("{{") && expression.includes("}}")
				? this.splitExpression(expression)
				: [expression, "", ""];

		if (!expressionToEvaluate) return prefix;

		const parsedExpression = await this.parseExpression(
			expressionToEvaluate,
			expressionContext
		);

		try {
			const expressionResult: T = new Function(
				`return ${parsedExpression};`
			)();
			return prefix
				? `${prefix}${expressionResult}${sufix ?? ""}`
				: expressionResult;
		} catch (error) {
			new Notice(
				`Error on evaluating ${this.formField.className} expression`
			);
			console.error(expressionToEvaluate);
			console.error(error);

			return `${prefix}${sufix ?? ""}`;
		}
	}

	protected splitExpression(expression: string): string[] {
		if (!(expression.includes("{{") && expression.includes("}}")))
			return [expression];

		const expressionMatcher = new RegExp(/{{(.*)}}/);

		const expressionToEvaluate = expressionMatcher.exec(expression)?.at(-1);

		const prefix = expression.split("{{")[0];
		const sufix = expression.split("}}")[1];

		return [prefix, expressionToEvaluate ?? "", sufix];
	}

	protected async parseExpression(
		expression: string,
		expressionContext?: FormFieldFactory[]
	): Promise<string> {
		//#region parse expression context
		const formFieldClassNames = expressionContext
			? getClassNamesFromExpression(expression)
			: [];

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
		//#endregion

		//#region parse file content
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
		//#endregion

		return expression;
	}

	protected hideFormField(hide: boolean): void {
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
