import {
	getClassNamesFromExpression,
	getDataAsFrontmatter,
	isInputExpressionSyntaxValid,
} from "utils";
import {
	BaseFormField,
	ExpressionProperty,
	FormFieldFactory,
	FormFieldFactoryParams,
} from "./form-field/form-field.factory";
import { TimeFormFieldFactory } from "./form-field/time-form-field.factory";
import { TextFormFieldFactory } from "./form-field/text-form-field.factory";
import {
	DropdownFormField,
	DropdownFormFieldFactory,
} from "./form-field/dropdown-form-field.factory";
import { App, Modal, Notice, Setting } from "obsidian";
import {
	FORM_FIELD_ELEMENT_TYPE,
	FormField,
} from "./form-field/form-field.constants";
import { ToggleFormFieldFactory } from "./form-field/toggle-form-field.factory";
import {
	RangeFormField,
	RangeFormFieldFactory,
} from "./form-field/range-form-field.factory";
import { ExpressionEvaluator } from "./utils/expression-evaluator";
import { TextAreaFormFieldFactory } from "./form-field/textarea-form-field.factory";
import { DateFormFieldFactory } from "./form-field/date-form-field.factory";

export interface IFieldData {
	className: string;
	fieldType: FORM_FIELD_ELEMENT_TYPE;
	fieldValue?: string;
}

export interface IForm {
	title: string;
	description?: string;
	formFields: FormField[];
	path: string;
	outputName?: string;
	onSubmit?: (data: any) => void;
	submitLabel?: string;
		showRibbonIcon?: boolean;
		ribbonIconName?: string;}

export class Form extends Modal {
	contentEl: HTMLElement;
	app: App;

	private title: string;
	private description?: string;
	private submitLabel: string;
	private onSubmit: (data: any) => void;
	private path: string;
	private outputName?: string;

	private formFieldFactories: FormFieldFactory[] = [];
	private formFields: BaseFormField[];

	constructor(app: App, params: IForm) {
		super(app);

		this.app = app;

		this.formFields = params.formFields;
		this.title = params.title;
		this.description = params.description;
		this.submitLabel = !!params.submitLabel ? params.submitLabel : "Submit";
		this.onSubmit = params.onSubmit ?? this.defaultOnSubmit;
		this.path = params.path;
		this.outputName = params.outputName;
	}

	onClose(): void {
		this.setFormDataNull();
	}

	async onOpen(): Promise<void> {
		this.contentEl.createEl("h2", { text: this.title });
		if (this.description) {
			this.contentEl.createEl("p", { text: this.description });
		}
		await this.createFormFields();

		new Setting(this.contentEl).addButton((button) =>
			button
				.setButtonText(this.submitLabel)
				.setCta()
				.onClick(this.handleSubmit.bind(this))
		);
	}

	public async createFormFields(): Promise<void> {
		this.formFields.forEach((formField) => {
			this.populateExpressionPropertyContexts(formField);
			const factoryParams: FormFieldFactoryParams = {
				formField,
				app: this.app,
				contentEl: this.contentEl,
				hideExpressionContext: this.getExpressionContext(
					formField?.hideExpression?.expressionParams?.expression
				),
			};

			switch (formField.type) {
				case FORM_FIELD_ELEMENT_TYPE.DATE:
					this.formFieldFactories.push(
						new DateFormFieldFactory(factoryParams)
					);
					break;
				case FORM_FIELD_ELEMENT_TYPE.TEXT:
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
					const dropDownField =
						factoryParams.formField as DropdownFormField;

					this.formFieldFactories.push(
						new DropdownFormFieldFactory({
							formField: dropDownField,
							app: factoryParams.app,
							contentEl: factoryParams.contentEl,
							hideExpressionContext:
								factoryParams.hideExpressionContext,
						})
					);
					break;
				case FORM_FIELD_ELEMENT_TYPE.TOGGLE:
					this.formFieldFactories.push(
						new ToggleFormFieldFactory(factoryParams)
					);
					break;
				case FORM_FIELD_ELEMENT_TYPE.RANGE:
					this.formFieldFactories.push(
						new RangeFormFieldFactory(factoryParams)
					);
					break;
				case FORM_FIELD_ELEMENT_TYPE.TEXTAREA:
					this.formFieldFactories.push(
						new TextAreaFormFieldFactory(factoryParams)
					);
					break;
			}
		});

		for (const factory of this.formFieldFactories) {
			await factory.initializeFormField(
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
		formFieldFactories = formFieldFactories.filter(
			(factory) => factory.formField.className !== fieldClassName
		);

		const hasReference = (
			exp: ExpressionProperty<any> | undefined,
			fieldClassName: string
		): boolean =>
			exp?.expressionParams?.expression?.includes(
				`$$.${fieldClassName}`
			) ?? false;

		const expressionProperties: ((
			f: FormField
		) => ExpressionProperty<any> | undefined)[] = [
			(f: FormField) => f.content,
			(f: FormField) => f.hideExpression,
			(f: FormField) => f.placeholder,
			(f: FormField) => f.description,
		];

		const dropdownExpressionProperties = [
			(f: DropdownFormField) => f.options,
		];

		const rangeExpressionProperties = [
			(f: RangeFormField) => f.minLimit,
			(f: RangeFormField) => f.maxLimit,
			(f: RangeFormField) => f.step,
		];

		const dependents = formFieldFactories.filter((factory) => {
			if (factory.formField.type === FORM_FIELD_ELEMENT_TYPE.DROPDOWN)
				expressionProperties.push(...dropdownExpressionProperties);

			if (factory.formField.type === FORM_FIELD_ELEMENT_TYPE.RANGE)
				expressionProperties.push(...rangeExpressionProperties);

			return expressionProperties.some((prop) =>
				hasReference(prop(factory.formField), fieldClassName)
			);
		});

		return dependents;
	}

	private populateExpressionPropertyContexts(formField: BaseFormField): void {
		const populatePropertyExpressionContext = (
			property: ExpressionProperty<any>
		) => {
			if (
				property &&
				typeof property === "object" &&
				"expressionParams" in property &&
				typeof property.expressionParams === "object" &&
				"expression" in property.expressionParams
			) {
				property.expressionParams.context = this.getExpressionContext(
					property.expressionParams.expression
				);
			}
		};

		const keys: (keyof FormField)[] = [
			"content",
			"placeholder",
			"description",
			"hideExpression",
		];

		keys.forEach((key) =>
			populatePropertyExpressionContext(
				formField[key] as ExpressionProperty<any>
			)
		);

		if (formField.type === FORM_FIELD_ELEMENT_TYPE.DROPDOWN)
			populatePropertyExpressionContext(
				(formField as DropdownFormField)["options"]
			);

		if (formField.type === FORM_FIELD_ELEMENT_TYPE.RANGE) {
			populatePropertyExpressionContext(
				(formField as RangeFormField)["minLimit"]
			);
			populatePropertyExpressionContext(
				(formField as RangeFormField)["maxLimit"]
			);
			populatePropertyExpressionContext(
				(formField as RangeFormField)["step"]
			);
		}
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

	public getData(): IFieldData[] {
		const data: IFieldData[] = [];

		this.formFieldFactories.forEach((factory) => {
			if (factory.formField.writeToOutputNote !== false) {
				data.push({
					className: factory.formField.className,
					fieldType: factory.formField.type,
					fieldValue: factory.formField.content.value,
				});
			}
		});
		return data;
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

	private setFormDataNull(): void {
		this.formFieldFactories = [];
		this.formFieldFactories.forEach(
			(factory) => (factory.formField.content.value = undefined)
		);
	}

	private defaultOnSubmit = async (data: IFieldData[]) => {
		const frontmatterData = getDataAsFrontmatter(data);

		let fileName = "";

		if (this.outputName) {
			const expressionEvaluator = new ExpressionEvaluator(this.app);
			const expressionContext = this.outputName.includes("$$.")
				? this.getExpressionContext(this.outputName)
				: undefined;

			const expressionResult =
				await expressionEvaluator.evaluateExpression<string>({
					expression: this.outputName,
					context: expressionContext,
				});

			fileName =
				typeof expressionResult === "object"
					? JSON.stringify(expressionResult)
					: expressionResult;
		} else fileName = new Date().getTime().toString(36);

		fileName =
			typeof fileName === "string" ? fileName : JSON.stringify(fileName);

		fileName = fileName.endsWith(".md")
			? `${this.path}${fileName}`
			: `${this.path}${fileName}.md`;

		this.app.vault.create(fileName, frontmatterData);
	};

	private handleSubmit() {
		// check required unfilled fields

		const requiredUnfilledField = this.getRequiredUnfilledField();

		if (requiredUnfilledField) {
			new Notice(
				`Fill in the ${requiredUnfilledField.name} field before submitting`
			);
			return;
		}

		let anyInvalidInputExpression = false;

		// check syntax errors on expressions

		const formInputExpressions = this.getInputExpressions();
		const filePathMatcher = new RegExp(`%%.*%%`);

		formInputExpressions.forEach((inputExpression) => {
			inputExpression.expression = inputExpression.expression.replace(
				filePathMatcher,
				"[]"
			);

			if (!isInputExpressionSyntaxValid(inputExpression.expression)) {
				new Notice(`Syntax error on ${inputExpression.fieldName}`);
				anyInvalidInputExpression = true;
			}
		});

		if (anyInvalidInputExpression) return;

		// submit form

		this.onSubmit(this.getData());
		this.close();
	}

	private getInputExpressions(): { fieldName: string; expression: string }[] {
		const inputExpressions: { fieldName: string; expression: string }[] =
			[];

		this.formFieldFactories.forEach(({ formField }) => {
			if (!formField.content.value) return;

			const expressionMatcher = new RegExp(/{{(.*)}}/);

			const expressionToEvaluate = expressionMatcher
				.exec(formField.content.value)
				?.at(-1);

			if (expressionToEvaluate)
				inputExpressions.push({
					fieldName: formField.name,
					expression: expressionToEvaluate,
				});
		});

		return inputExpressions;
	}

	private getRequiredUnfilledField(): FormField | undefined {
		const requiredFields = this.formFieldFactories
			.filter((factory) => factory.formField.required)
			.map((factory) => factory.formField);

		return requiredFields.find((field) => !field.content.value?.trim());
	}
}
