import { getClassNamesFromExpression } from "utils";
import {
	BaseFormField,
	FormFieldFactory,
} from "./form-field/form-field.factory";
import { TimeFormFieldFactory } from "./form-field/time-form-field.factory";
import { TextFormFieldFactory } from "./form-field/text-form-field.factory";
import {
	DropdownFormField,
	DropdownFormFieldFactory,
} from "./form-field/dropdown-form-field.factory";
import { App } from "obsidian";
import { FORM_FIELD_ELEMENT_TYPE } from "./form-field/form-field.constants";

export class Form {
	private contentEl: HTMLElement;
	private app: App;

	private formFieldFactories: FormFieldFactory[] = [];
	private formFields: BaseFormField[];

	constructor(contentEl: HTMLElement, app: App, formFields: BaseFormField[]) {
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
				hideExpressionContext: this.getExpressionContext(
					formField?.hideExpression
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
					const dropDownField =
						factoryParams.formField as DropdownFormField;
					this.formFieldFactories.push(
						new DropdownFormFieldFactory({
							optionExpressionContext: this.getExpressionContext(
								(formField as DropdownFormField).options
									.expression
							),
							formField: dropDownField,
							app: factoryParams.app,
							contentEl: factoryParams.contentEl,
							expressionContext: factoryParams.expressionContext,
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
				).options?.expression?.includes(`$$.${fieldClassName}`) ||
				factory.formField.hideExpression?.includes(
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
