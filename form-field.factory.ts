import { DropdownFormField, FORM_FIELD_ELEMENT_TYPE, FormField } from "form";
import { Notice, Setting } from "obsidian";

abstract class FormFieldFactory {
	contentEl: HTMLElement;
	formField: FormField;
	dependentFields?: FormField[];
	sourceField?: FormField;

	constructor(
		contentEl: HTMLElement,
		formField: FormField,
		dependentFields?: FormField[],
		sourceField?: FormField
	) {
		this.contentEl = contentEl;
		this.formField = formField;
		this.dependentFields = dependentFields;
		this.sourceField = sourceField;
	}

	abstract createFormField(): Setting;

	protected setFormFieldType(): void {
		const htmlEl = this.contentEl.querySelector(
			`.${this.formField.className} > .setting-item-control`
		);

		htmlEl?.firstElementChild?.setAttribute("type", this.formField.type);
	}

	protected resolveFormFieldValue(): string {
		if (this.formField.content.value) return this.formField.content.value;

		return (this.formField.content["value"] =
			this.sourceField?.content.value ?? "");
	}

	protected findFormFieldElement(formField: FormField): Element | null {
		const leafElement = this.getLeafElementByElementType(formField.type);

		const formFieldElement = this.contentEl.querySelector(
			`.${formField.className} > .setting-item-control > ${leafElement}`
		);

		return formFieldElement;
	}

	private getLeafElementByElementType(
		elementType: FORM_FIELD_ELEMENT_TYPE
	): string {
		switch (elementType) {
			case FORM_FIELD_ELEMENT_TYPE.TEXT:
			case FORM_FIELD_ELEMENT_TYPE.DATE:
			case FORM_FIELD_ELEMENT_TYPE.TIME:
				return "input";
			case FORM_FIELD_ELEMENT_TYPE.DROPDOWN:
				return "dropdown";
			default:
				throw new Error(
					`Unexpected form field element type: ${elementType}`
				);
		}
	}

	protected onChangeHandler(value: string) {
		new Notice(`${this.formField.className} changed: ${value}`);

		console.log(this.formField);
    console.log(this.dependentFields)

		this.dependentFields?.map((dependentField) => {
			const dependentFieldEl = this.findFormFieldElement(dependentField);

			if (dependentFieldEl)
				this.assingToDependentField(
					dependentField,
					dependentFieldEl as HTMLInputElement,
					value
				);
		});

		this.formField.content["value"] = value;
	}

	private assingToDependentField(
		dependentField: FormField,
		dependentFieldEl: HTMLInputElement,
		value: string
	) {
		console.log(dependentFieldEl);
		const valueToAssign =
			this.formField.type === FORM_FIELD_ELEMENT_TYPE.DROPDOWN
				? (this.formField as DropdownFormField).options[value]
				: value;

		(dependentFieldEl as HTMLInputElement).value = valueToAssign;
		dependentField.content["value"] = valueToAssign;
	}
}

export class TextFormFieldFactory extends FormFieldFactory {
	constructor(
		contentEl: HTMLElement,
		formField: FormField,
		dependentFields?: FormField[],
		sourceField?: FormField
	) {
		super(contentEl, formField, dependentFields, sourceField);
	}

	createFormField(): Setting {
		const setting = new Setting(this.contentEl)
			.setName(this.formField.name)
			.setClass(this.formField.className);

		setting.addText((text) =>
			text
				.setValue(this.resolveFormFieldValue())
				.onChange(this.onChangeHandler.bind(this))
		);

		this.setFormFieldType();

		if (this.formField.description)
			setting.setDesc(this.formField.description);

		return setting;
	}
}

export class DropownFormFieldFactory extends FormFieldFactory {
	formField: DropdownFormField;
	constructor(
		contentEl: HTMLElement,
		formField: DropdownFormField,
		dependentFields?: FormField[]
	) {
		super(contentEl, formField, dependentFields);
	}

	createFormField(): Setting {
		const setting = new Setting(this.contentEl)
			.setName(this.formField.name)
			.setClass(this.formField.className);

		setting.addDropdown((dropdown) =>
			dropdown
				.addOptions(this.formField.options)
				.onChange(this.onChangeHandler.bind(this))
		);

		const firstOptionKey = Object.keys(this.formField.options)[0];

		this.formField.content["value"] = this.formField.content.value
			? this.formField.content.value
			: this.formField.options[firstOptionKey];

		this.setFormFieldType();

		if (this.formField.description)
			setting.setDesc(this.formField.description);

		return setting;
	}
}

export class Form {
	contentEl: HTMLElement;
	formFields: FormField[];

	constructor(contentEl: HTMLElement, formFields: FormField[]) {
		this.contentEl = contentEl;
		this.formFields = formFields;

		this.createFormFields();
	}

	createFormFields(): void {
		this.formFields.map((formField) => {
			if (formField.setting) formField.setting.clear();

			let formFieldFactory = undefined;

			switch (formField.type) {
				case FORM_FIELD_ELEMENT_TYPE.TEXT:
				case FORM_FIELD_ELEMENT_TYPE.DATE:
				case FORM_FIELD_ELEMENT_TYPE.TIME:
					formFieldFactory = new TextFormFieldFactory(
						this.contentEl,
						formField,
						this.getDependentFields(formField.className),
						this.getSourceField(formField)
					);
					break;
				case FORM_FIELD_ELEMENT_TYPE.DROPDOWN:
					formFieldFactory = new DropownFormFieldFactory(
						this.contentEl,
						formField as DropdownFormField,
						this.getDependentFields(formField.className)
						// this.getSourceField(formField),
					);

					break;
			}
			formField.setting = formFieldFactory?.createFormField();
		});

		console.log(this.formFields);
	}

	private getDependentFields(
		fieldClassName: string
	): FormField[] | undefined {
		return this.formFields.filter((formField) =>
			formField.content?.source?.includes(`$$.${fieldClassName}`)
		);
	}

	private getSourceField(formField: FormField): FormField | undefined {
		if (!formField.content?.source?.includes("$$")) return;

		const sourceFieldClassName = formField.content.source.split(".")[1];

		return this.formFields.find(
			(formField) => formField.className === sourceFieldClassName
		);
	}
}
