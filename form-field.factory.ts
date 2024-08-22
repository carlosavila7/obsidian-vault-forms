import { DropdownFormField, FORM_FIELD_ELEMENT_TYPE, FormField } from "form";
import { Notice, Setting } from "obsidian";

abstract class FormFieldFactory {
	contentEl: HTMLElement;
	formField: FormField;

	constructor(contentEl: HTMLElement, formField: FormField) {
		this.contentEl = contentEl;
		this.formField = formField;
	}

	abstract createFormField(
		dependentFields?: FormFieldFactory[],
		sourceField?: FormFieldFactory
	): Setting;

	protected setFormFieldType(): void {
		const htmlEl = this.contentEl.querySelector(
			`.${this.formField.className} > .setting-item-control`
		);

		htmlEl?.firstElementChild?.setAttribute("type", this.formField.type);
	}

	protected resolveFormFieldValue(sourceField?: FormField): string {
		if (this.formField.content.value) return this.formField.content.value;

		return (this.formField.content["value"] =
			sourceField?.content.value ?? "");
	}

	protected getFormFieldHtmlPath(formField: FormField): string {
		return `div.${formField.className} > div.setting-item-control > input`;
	}

	protected onChangeHandler(
		value: string,
		dependentFields: FormFieldFactory[]
	) {
		new Notice(`${this.formField.className} changed: ${value}`);

		dependentFields?.map((dependentField) =>
			dependentField.assingValue(value, this.formField)
		);

		this.formField.content["value"] = value;
	}

	protected assingValue(value: string, _?: FormField) {
		const fieldEl = this.contentEl.querySelector(
			this.getFormFieldHtmlPath(this.formField)
		);

		(fieldEl as HTMLInputElement).value = value;
		this.formField.content["value"] = value;
	}
}

export class TextFormFieldFactory extends FormFieldFactory {
	constructor(contentEl: HTMLElement, formField: FormField) {
		super(contentEl, formField);
	}

	createFormField(
		dependentFields?: FormFieldFactory[],
		sourceField?: FormFieldFactory
	): Setting {
		// console.log(this.formField);
		const setting = new Setting(this.contentEl)
			.setName(this.formField.name)
			.setClass(this.formField.className);

		setting.addText((text) =>
			text
				.setValue(this.resolveFormFieldValue(sourceField?.formField))
				.onChange((value) =>
					this.onChangeHandler.bind(this)(value, dependentFields)
				)
		);

		this.setFormFieldType();

		if (this.formField.description)
			setting.setDesc(this.formField.description);

		return setting;
	}
}

export class DropownFormFieldFactory extends FormFieldFactory {
	formField: DropdownFormField;
	constructor(contentEl: HTMLElement, formField: DropdownFormField) {
		super(contentEl, formField);
	}

	createFormField(
		dependentFields?: FormFieldFactory[],
		sourceField?: FormFieldFactory
	): Setting {
		// console.log(this.formField);
		const setting = new Setting(this.contentEl)
			.setName(this.formField.name)
			.setClass(this.formField.className);

		setting.addDropdown((dropdown) =>
			dropdown
				.addOptions(this.formField.options)
				.onChange((value) =>
					this.onChangeHandler.bind(this)(value, dependentFields)
				)
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

	protected getFormFieldHtmlPath(formField: FormField): string {
		return `div.${formField.className} > div.setting-item-control > select`;
	}

	protected assingValue(value: string, sourceFormField?: FormField): void {
		console.log("assinging dropdown typed");
		const formFieldHtmlPath = this.getFormFieldHtmlPath(this.formField);
		const fieldEl = this.contentEl.querySelector(formFieldHtmlPath);

		const postAddedOption = this.contentEl?.querySelector(
			`${formFieldHtmlPath} > option.${
				sourceFormField?.className ?? "post-added-option"
			}`
		);

		if (postAddedOption) fieldEl?.removeChild(postAddedOption);

		fieldEl
			?.createEl("option", { value: value, text: value })
			.setAttr(
				"class",
				sourceFormField?.className ?? "post-added-option"
			);

		this.formField.content["value"] = value;
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
		formFields.map((formField) => {
			if (formField.setting) formField.setting.clear();

			switch (formField.type) {
				case FORM_FIELD_ELEMENT_TYPE.TEXT:
				case FORM_FIELD_ELEMENT_TYPE.DATE:
				case FORM_FIELD_ELEMENT_TYPE.TIME:
					this.formFieldFactories.push(
						new TextFormFieldFactory(this.contentEl, formField)
					);
					break;
				case FORM_FIELD_ELEMENT_TYPE.DROPDOWN:
					this.formFieldFactories.push(
						new DropownFormFieldFactory(
							this.contentEl,
							formField as DropdownFormField
						)
					);

					break;
			}
		});

		this.formFieldFactories.map((factory) =>
			factory.createFormField(
				this.getDependentFields(factory.formField.className),
				this.getSourceField(factory.formField)
			)
		);
	}

	private getDependentFields(
		fieldClassName: string
	): FormFieldFactory[] | undefined {
		return this.formFieldFactories.filter((factory) =>
			factory.formField.content?.source?.includes(`$$.${fieldClassName}`)
		);
	}

	private getSourceField(formField: FormField): FormFieldFactory | undefined {
		if (!formField.content?.source?.includes("$$")) return;

		const sourceFieldClassName = formField.content.source.split(".")[1];

		return this.formFieldFactories.find(
			(factory) => factory.formField.className === sourceFieldClassName
		);
	}
}
