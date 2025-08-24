import { App, Modal, Notice, Setting } from "obsidian";
import { Form, IForm, IFieldData } from "src/form";
import { DropdownFormField } from "src/form-field/dropdown-form-field.factory";
import { FormField } from "src/form-field/form-field.constants";
import { fromFormDataToFormField } from "utils";
import { ConfirmationModal } from "./confirmation-modal";
import { handleFormField } from "./handle-form-modal.constants";
import { RangeFormField } from "src/form-field/range-form-field.factory";

interface HandleFormModalParams {
	app: App;
	type: "Create" | "Update";
	onSubmit: (createdForm: IForm) => void;
	formData?: IForm;
}

export class HandleFormModal extends Modal {
	private readonly SUBMIT_CLASS = "submit-form-footer";
	private readonly FIELDS_SECTION = "fields-section";

	private form: IForm;
	private type: "Create" | "Update";

	onSubmit: (createdForm: IForm) => void;

	constructor(params: HandleFormModalParams) {
		super(params.app);
		this.app = params.app;
		this.type = params.type;
		this.onSubmit = params.onSubmit;

		if (params.formData) this.form = params.formData;
		else {
			this.form = {} as IForm;
			this.form["formFields"] = [];
		}
	}

	onOpen(): void {
		const { contentEl } = this;

		contentEl.createEl("h2", {
			text: `${this.type} form`,
		});

		new Setting(contentEl)
			.setName("Form name")
			.setDesc("Insert here the form name")
			.addText((txt) =>
				txt
					.setValue(this.form.title ?? "")
					.onChange((value) => (this.form["title"] = value))
			);

		new Setting(contentEl)
			.setName("Path")
			.setDesc("Insert the path on your vault")
			.addText((txt) =>
				txt
					.setValue(this.form.path ?? "")
					.setPlaceholder("folder_inside_my_vault/")
					.onChange((value) => (this.form["path"] = value))
			);

		new Setting(contentEl)
			.setName("Output name")
			.setDesc("Optional note name setting")
			.addText((txt) =>
				txt
					.setValue(this.form.outputName ?? "")
					.onChange((value) => (this.form["outputName"] = value))
			);

		new Setting(contentEl)
			.setName("Submit label")
			.setDesc("Enter the button label for the submit button")
			.addText((txt) =>
				txt
					.setValue(this.form.submitLabel ?? "")
					.setPlaceholder("Submit")
					.onChange((value) => (this.form["submitLabel"] = value))
			);

		contentEl.createEl("h3", { text: "Fields" });

		this.refreshFieldsSection();
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

		const formParams: IForm = {
			formFields: handleFormField,
			title: `${this.type} new form field`,
			onSubmit: this.addNewField.bind(this),
			submitLabel: `${this.type} field`,
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
					.setButtonText(`${this.type} form`)
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
			const formParams: IForm = {
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
				this.close();
			} else
				new Notice(
					`Fill in the ${requiredUnfilled} field before submitting`
				);
		} else {
			new Notice(
				`Can't create form. Class name (${duplicatedClassName}) is not unique`
			);
		}
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

	private getDeleteFieldCallback(className: string) {
		return () => {
			this.form.formFields = this.form.formFields.filter(
				(formField) => formField.className !== className
			);

			this.refreshFieldsSection();
		};
	}

	private refreshFieldsSection() {
		this.removeSubmitSection();
		this.removeFieldsSection();

		console.log(this.form.formFields);

		this.form.formFields.forEach((formField) => {
			new Setting(this.contentEl)
				.setName(formField.name)
				.setClass(this.FIELDS_SECTION)
				.setDesc(`${formField.type} - ${formField.className}`)
				.addExtraButton((btn) =>
					btn
						.setIcon("pencil")
						.setTooltip("Edit field")
						.onClick(() =>
							this.handleFormFieldUpdate.bind(this)(
								formField.className
							)
						)
				)
				.addExtraButton((btn) =>
					btn
						.setIcon("trash-2")
						.setTooltip("Delete field")
						.onClick(() => {
							const confirmationModal = new ConfirmationModal({
								app: this.app,
								description: `Are you sure you want to delete the ${formField.name} field?`,
								onSubmit: this.getDeleteFieldCallback(
									formField.className
								).bind(this),
								submitLabel: "Delete",
								title: "Are you sure?",
							});

							confirmationModal.open();
						})
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
		const updateForm: FormField[] = JSON.parse(
			JSON.stringify(handleFormField)
		);

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
					valueToAssing =
						formField.description?.expressionParams?.expression;
					break;
				case "field-placeholder":
					valueToAssing =
						formField.placeholder?.expressionParams?.expression;
					break;
				case "field-hide-expression":
					valueToAssing =
						formField.hideExpression?.expressionParams?.expression;
					break;
				case "field-required":
					valueToAssing = `${formField.required}`;
					break;
				case "field-default-value":
					valueToAssing =
						formField.content.expressionParams?.expression;
					break;
				// dropdown-specific-fields
				case "field-dropdown-options":
					field.bypassValueExpressionEvaluation = true;
					valueToAssing = (formField as DropdownFormField)?.options
						.expressionParams?.expression;
					break;
				// range-specific-fields
				case "field-min":
					valueToAssing = (formField as RangeFormField).minLimit
						.expressionParams?.expression;
					break;
				case "field-max":
					valueToAssing = (formField as RangeFormField).maxLimit
						.expressionParams?.expression;
					break;
				case "field-step":
					valueToAssing = (formField as RangeFormField).step
						.expressionParams?.expression;
					break;
			}

			field.content = {
				value: undefined,
				expressionParams: { expression: valueToAssing },
			};
		});

		return updateForm;
	}

	private getRequiredUnfilledField(): string | undefined {
		if (!this.form.title) return "Form name";
		if (!this.form.path) return "Path";

		return;
	}

	private postProcessParams(): void {
		this.form.path = this.form.path.endsWith("/")
			? this.form.path
			: `${this.form.path}/`;

		this.form.path = this.form.path.startsWith("/")
			? this.form.path.split("").splice(1).join("")
			: this.form.path;
	}
}
