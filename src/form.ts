import { getClassNamesFromExpression, getDataAsFrontmatter } from "utils";
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
import { App, Modal, Notice, Setting } from "obsidian";
import {
	FORM_FIELD_ELEMENT_TYPE,
	FormField,
} from "./form-field/form-field.constants";

export interface IFieldData {
	className: string;
	fieldType: FORM_FIELD_ELEMENT_TYPE;
	fieldValue?: string;
}

export interface IForm {
	title: string;
	formFields: FormField[];
	path: string;
	onSubmit?: (data: any) => void;
	submitLabel?: string;
}

export class Form extends Modal {
	contentEl: HTMLElement;
	app: App;

	private title: string;
	private submitLabel: string;
	private onSubmit: (data: any) => void;
	private path: string;

	private formFieldFactories: FormFieldFactory[] = [];
	private formFields: BaseFormField[];

	constructor(app: App, params: IForm) {
		super(app);

		this.app = app;

		this.formFields = params.formFields;
		this.title = params.title;
		this.submitLabel = params.submitLabel ?? "Submit";
		this.onSubmit = params.onSubmit ?? this.defaultOnSubmit;
		this.path = params.path;

		this.open();
	}

	onClose(): void {
		this.setFormDataNull();
	}

	async onOpen(): Promise<void> {
		this.contentEl.createEl("h2", { text: this.title });
		await this.createFormFields();

		new Setting(this.contentEl).addButton((button) =>
			button
				.setButtonText(this.submitLabel)
				.setCta()
				.onClick(() => {
					const requiredUnfilledField =
						this.getRequiredUnfilledField();
					if (!requiredUnfilledField) {
						this.onSubmit(this.getData());
						this.close();
					} else
						new Notice(
							`Fill in the ${requiredUnfilledField.name} field before submitting`
						);
				})
		);
	}

	private getRequiredUnfilledField(): FormField | undefined {
		const requiredFields = this.formFieldFactories
			.filter((factory) => factory.formField.required)
			.map((factory) => factory.formField);

		return requiredFields.find((field) => !field.content.value?.trim());
	}

	public async createFormFields(): Promise<void> {
		this.formFields.forEach((formField) => {

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

	public getData(): IFieldData[] {
		const data: IFieldData[] = [];

		this.formFieldFactories.map((factory) =>
			data.push({
				className: factory.formField.className,
				fieldType: factory.formField.type,
				fieldValue: factory.formField.content.value,
			})
		);
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

	public setFormDataNull(): void {
		this.formFieldFactories.forEach(
			(factory) => (factory.formField.content.value = undefined)
		);
	}

	private defaultOnSubmit = (data: IFieldData[]) => {
		const frontmatterData = getDataAsFrontmatter(data);
		const fileName = new Date().getTime().toString(36);
		
		this.app.vault.create(`${this.path}${fileName}.md`, frontmatterData);
	};
}
