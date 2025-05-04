import MyPlugin from "main";
import { Notice, PluginSettingTab, Setting } from "obsidian";
import { FormBo, MyPluginSettings } from "./handle-form-modal.constants";
import { HandleFormModal } from "./handle-form-modal";
import { IForm } from "src/form";
import { ConfirmationModal } from "./confirmation-modal";

export class mySettingsTab extends PluginSettingTab {
	private readonly FORM_LIST_ITEM_CLASS = "form-list-item";

	plugin: MyPlugin;
	settings: MyPluginSettings;

	constructor(plugin: MyPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;

		this.plugin.loadSettings();
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Create new form")
			.setDesc("Click here to create a new form")
			.addButton((btn) =>
				btn.setButtonText("Create form").onClick(() =>
					new HandleFormModal({
						app: this.app,
						onSubmit: this.onCreateFormSubmit.bind(this),
						type: "Create",
					}).open()
				)
			);

		containerEl.createEl("h2", { text: "Forms" });

		this.renderFormList();
	}

	async onCreateFormSubmit(createdForm: IForm) {
		const formId = `${createdForm.title?.replace(/\s/gm, "-")}-${new Date()
			.getTime()
			.toString(36)}`;

		const createdFormBo: FormBo = {
			id: formId,
			active: true,
			...createdForm,
		};

		this.plugin.settings.forms = this.plugin.settings.forms?.length
			? [createdFormBo, ...this.plugin.settings.forms]
			: [createdFormBo];

		await this.plugin.saveSettings();

		this.renderFormList();
	}

	private renderFormList() {
		this.removeFieldsSection();

		this.plugin.settings.forms?.forEach((form) => {
			this.createFormItemList(form);
			if (form.active) this.plugin.addCommandForm(form);
		});
	}

	private createFormItemList(form: FormBo) {
		new Setting(this.containerEl)
			.setName(form.title)
			.setDesc(form.path)
			.setClass(this.FORM_LIST_ITEM_CLASS)
			.addExtraButton((extraButton) =>
				extraButton.setIcon("gear").onClick(() => {
					const updateForm = new HandleFormModal({
						app: this.app,
						onSubmit: this.getUpdateFormCallback(form.id).bind(
							this
						),
						formData: form,
						type: "Update",
					});
					updateForm.open();
				})
			)
			.addExtraButton((extraButton) =>
				extraButton.setIcon("trash-2").onClick(() => {
					const confirmationModal = new ConfirmationModal({
						app: this.app,
						title: "Are you sure?",
						description: `Are you sure you want to delete the ${form.title} form?`,
						onSubmit: this.getDeleteFormCallback(form).bind(this),
						submitLabel: "Delete",
					});

					confirmationModal.open();
				})
			)
			.addToggle((toggle) => {
				toggle
					.setValue(form.active)
					.onChange(this.getToogleFormActiveCallback(form.id));
			});
	}

	getUpdateFormCallback(formId: string) {
		return async (updatedForm: IForm) => {
			this.plugin.settings.forms = this.plugin.settings.forms.map(
				(form) => {
					if (form.id === formId) {
						form = Object.assign(form, updatedForm);
					}
					return form;
				}
			);

			await this.plugin.saveSettings();

			this.renderFormList();
		};
	}

	private getToogleFormActiveCallback(formId: string) {
		return () => {
			const formToToogle = this.plugin.settings.forms.find(
				(form) => form.id === formId
			);

			if (formToToogle) formToToogle.active = !formToToogle?.active;
			else
				console.error(
					`[toogleFormActive] Can't find form with id ${formId}`
				);

			this.plugin.saveSettings();
			this.renderFormList();
		};
	}

	private getDeleteFormCallback(form: FormBo) {
		return () => {
			this.plugin.settings.forms = this.plugin.settings.forms.filter(
				(f) => f.id !== form.id
			);

			if (form.active) new Notice("Reload plugin to fully remove form");

			this.plugin.saveSettings();
			this.renderFormList();
		};
	}

	private removeFieldsSection() {
		const fieldEls = this.containerEl.querySelectorAll(
			`.${this.FORM_LIST_ITEM_CLASS}`
		);

		fieldEls?.forEach((fieldEl) => fieldEl?.remove());
	}
}