import { hideExpressionExample } from "_examples";
import { Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import { Form, ICreateForm } from "src/form";
import { CreateFormModal } from "src/settings/create-form-field";

interface MyPluginSettings {
	forms: ICreateForm[];
}

class mySettingsTab extends PluginSettingTab {
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
				btn
					.setButtonText("New form")
					.onClick(() =>
						new CreateFormModal(
							this.app,
							this.onCreateFormSubmit.bind(this)
						).open()
					)
			);

		containerEl.createEl("h2", { text: "Forms" });

		this.plugin.settings.forms.forEach((form) => {
			new Setting(containerEl)
				.setName(form.title)
				.setDesc(form.path)
				.addExtraButton((extraButton) =>
					extraButton.setIcon("gear").onClick(() => {
						new Notice("extra btn");
					})
				)
				.addButton((button) =>
					button
						.setButtonText("delete")
						.onClick(() => {
							new Notice("delete btn");
						})
						.setWarning()
				)
				.addButton((button) =>
					button.setButtonText("Open Modal").onClick(() => {
						new Notice("main btn");
					})
				);
		});
	}

	async onCreateFormSubmit(createdForm: ICreateForm) {
		this.plugin.settings.forms = this.plugin.settings.forms?.length
			? [createdForm, ...this.plugin.settings.forms]
			: [createdForm];
		this.plugin.saveSettings();
		new Notice("CreateForm submitted");
		console.log(this.plugin.settings);

		const commandId = `${createdForm.title?.replace(
			/\s/gm,
			"-"
		)}-${new Date().getTime().toString(36)}`;

		this.plugin.addCommand({
			id: commandId,
			name: createdForm.title,
			callback: () => {
				new Form(this.app, createdForm).open();
			},
		});
	}
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.saveSettings();
		await this.loadSettings();

		const formParams: ICreateForm = {
			formFields: hideExpressionExample,
			title: "This is a form field",
			path: "expenses/",
			submitLabel: "Submit ribbon form",
		};

		this.addRibbonIcon("wallet", formParams.title, () => {
			const form = new Form(this.app, formParams);
		});

		this.addSettingTab(new mySettingsTab(this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			// DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
