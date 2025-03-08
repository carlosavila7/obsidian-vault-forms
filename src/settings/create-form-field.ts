import { App, Modal, Notice, Setting } from "obsidian";
import { Form, ICreateForm, IFieldData } from "src/form";
import { DropdownFormField } from "src/form-field/dropdown-form-field.factory";
import {
	FORM_FIELD_ELEMENT_TYPE,
	FormField,
} from "src/form-field/form-field.constants";
import { fromFormDataToFormField, getDataAsFrontmatter } from "utils";

const createForm: FormField[] = [
	{
		type: FORM_FIELD_ELEMENT_TYPE.DROPDOWN,
		name: "Type",
		className: "field-type",
		content: {},
		options: { value: ["text", "date", "time", "number", "dropdown"] },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Name",
		description: "Enter the field name",
		className: "field-name",
		required: true,
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Class name",
		description: "Field identifier",
		className: "field-class-name",
		content: {
			expression:
				"field-{{$$.field-name.toLowerCase().replaceAll(' ', '-')}}",
		},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Description",
		description: "Optional - Enter field description",
		className: "field-description",
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Placeholder",
		description: "Optional - Enter field placeholder",
		className: "field-placeholder",
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Hide Expression",
		description: "Optional - Enter expression to hide field if true",
		className: "field-hide-expression",
		bypassValueExpressionEvaluation: true,
		placeholder: "{{field-foo === 'bar'}}",
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Required",
		description: "To be replaced by toogle element. 1 for true, 0 false",
		className: "field-required",
		content: { expression: "1" },
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Default Value",
		description: "Optional - Involve in {{}} to write expression",
		className: "field-default-value",
		bypassValueExpressionEvaluation: true,
		content: {},
	},
	{
		type: FORM_FIELD_ELEMENT_TYPE.TEXT,
		name: "Options",
		description: "Array of options - Involve in {{}} to write expression",
		placeholder: "{{ ['itemA', 'itemB']}}",
		className: "field-dropdown-options",
		hideExpression: "{{$$.field-type !== 'dropdown'}}",
		content: {},
	},
];

export class CreateFormModal extends Modal {
	private readonly SUBMIT_CLASS = "submit-form-footer";
	private readonly FIELDS_SECTION = "fields-section";

	form: ICreateForm;
	onSubmit: (createdForm: ICreateForm) => void;

	constructor(app: App, onSubmit: (createdForm: ICreateForm) => void) {
		super(app);
		this.app = app;
		this.onSubmit = onSubmit;

		this.form = {} as ICreateForm;
		this.form["formFields"] = [];
	}

	onOpen(): void {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "Create form" });

		new Setting(contentEl)
			.setName("Form name")
			.setDesc("Insert here the form name")
			.addText((txt) =>
				txt.onChange((value) => (this.form["title"] = value))
			);

		new Setting(contentEl)
			.setName("Path")
			.setDesc("Insert the path on your vault")
			.addText((txt) =>
				txt
					.setPlaceholder("folder_inside_my_vault/")
					.onChange((value) => (this.form["path"] = value))
			);

		new Setting(contentEl)
			.setName("Submit label")
			.setDesc("Enter the button label for the submit button")
			.addText((txt) =>
				txt
					.setPlaceholder("Submit")
					.onChange((value) => (this.form["submitLabel"] = value))
			);

		contentEl.createEl("h3", { text: "Fields" });

		this.appendSubmitSection();
	}

	private removeSubmitSection() {
		const submitFooterEl = this.contentEl.querySelector(
			`div.${this.SUBMIT_CLASS}`
		);
		const submitWarnEl = this.contentEl.querySelector(
			`div.${this.SUBMIT_CLASS}-warn`
		);

		submitFooterEl?.remove();
		submitWarnEl?.remove();
	}

	private appendSubmitSection() {
		const isDisabled = !this.form.formFields.length;

		if (isDisabled)
			new Setting(this.contentEl)
				.setClass(`${this.SUBMIT_CLASS}-warn`)
				.setDesc("Add some field to create a form");

		const formParams: ICreateForm = {
			formFields: createForm,
			title: "Create new form field",
			onSubmit: this.addNewField.bind(this),
			submitLabel: "Create field",
			path: "",
		};

		new Setting(this.contentEl)
			.setClass(this.SUBMIT_CLASS)
			.addButton((btn) =>
				btn.setButtonText("Add new field").onClick(() => {
					const form = new Form(this.app, formParams);
					form.open();
				})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Create form")
					.setCta()
					.setDisabled(isDisabled)
					.onClick(this.handleSubmit.bind(this))
			);
	}

	private handleFormFieldUpdate(fieldClassName: string) {
		const formFieldToUpdate = this.form.formFields.find(
			(formField) => formField.className === fieldClassName
		);

		if (formFieldToUpdate) {
			const formParams: ICreateForm = {
				formFields: this.getUpdateForm(formFieldToUpdate),
				title: "Update field",
				path: "",
				onSubmit: this.updateField.bind(this),
				submitLabel: "Update",
			};

			new Form(this.app, formParams).open();
		}
	}

	private handleSubmit() {
		console.log(this.form);
		const duplicatedClassName = this.getDuplicatedClassName();

		if (!duplicatedClassName) {
			const requiredUnfilled = this.getRequiredUnfilledField();

			if (!requiredUnfilled) {
				this.postProcessParams();
				this.onSubmit(this.form);
			} else
				new Notice(
					`Fill in the ${requiredUnfilled} field before submitting`
				);
		} else {
			new Notice(
				`Can't create form. Class name (${duplicatedClassName}) is not unique`
			);
		}
		this.close();
	}

	private addNewField(field: IFieldData[]) {
		const formField = fromFormDataToFormField(field);

		this.form.formFields.push(formField);

		this.refreshFieldsSection();
	}

	private updateField(field: IFieldData[]) {
		const updatedFormField = fromFormDataToFormField(field);

		this.form.formFields.forEach((formField) => {
			if (formField.className === updatedFormField.className)
				formField = Object.assign(formField, updatedFormField);
		});

		this.refreshFieldsSection();
	}

	private deleteField(className: string) {
		this.form.formFields = this.form.formFields.filter(
			(formField) => formField.className !== className
		);

		this.refreshFieldsSection();
	}

	private refreshFieldsSection() {
		this.removeSubmitSection();
		this.removeFieldsSection();

		this.form.formFields.forEach((formField) => {
			new Setting(this.contentEl)
				.setName(formField.name)
				.setClass(this.FIELDS_SECTION)
				.setDesc(`${formField.type} - ${formField.className}`)
				.addExtraButton((btn) =>
					btn
						.setIcon("pencil")
						.onClick(() =>
							this.handleFormFieldUpdate.bind(this)(
								formField.className
							)
						)
				)
				.addButton((btn) =>
					btn
						.onClick(() =>
							this.deleteField.bind(this)(formField.className)
						)
						.setButtonText("delete")
						.setWarning()
				);
		});

		this.appendSubmitSection();
	}

	private removeFieldsSection() {
		const fieldEls = this.contentEl.querySelectorAll(
			`.${this.FIELDS_SECTION}`
		);

		fieldEls.forEach((fieldEl) => fieldEl?.remove());
	}

	private getDuplicatedClassName(): string | undefined {
		const uniqueClassNames: string[] = [];

		for (const field of this.form.formFields) {
			if (uniqueClassNames.includes(field.className))
				return field.className;
			else uniqueClassNames.push(field.className);
		}
		return;
	}

	private getUpdateForm(formField: FormField) {
		const updateForm: FormField[] = JSON.parse(JSON.stringify(createForm));

		updateForm.map((field) => {
			let valueToAssing = undefined;

			switch (field.className) {
				case "field-type":
					valueToAssing = formField.type;
					break;
				case "field-name":
					valueToAssing = formField.name;
					break;
				case "field-class-name":
					valueToAssing = formField.className;
					break;
				case "field-description":
					valueToAssing = formField.description;
					break;
				case "field-placeholder":
					valueToAssing = formField.placeholder;
					break;
				case "field-hide-expression":
					valueToAssing = formField.hideExpression;
					break;
				case "field-required":
					valueToAssing = `${formField.required}`;
					break;
				case "field-default-value":
					valueToAssing = formField.content.expression;
					break;
				case "field-dropdown-options":
					field.bypassValueExpressionEvaluation = true;
					valueToAssing = (formField as DropdownFormField)?.options
						.expression;
					break;
			}

			field.content = { expression: valueToAssing };
		});

		return updateForm;
	}

	getRequiredUnfilledField(): string | undefined {
		if (!this.form.title) return "Form name";
		if (!this.form.path) return "Path";

		return;
	}

	postProcessParams(): void {
		this.form.path = this.form.path.endsWith("/")
			? this.form.path
			: `${this.form.path}/`;

		this.form.path = this.form.path.startsWith("/")
			? this.form.path.split("").splice(1).join("")
			: this.form.path;
	}
}
