import {
	FormField,
	formFieldExamples,
	personalFinanceReportExample,
} from "form";
import { Form } from "form-field.factory";
import {
	App,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.saveSettings();
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"wallet",
			"Report expense",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new SampleModal(this.app, personalFinanceReportExample).open();
			}
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(formFieldExamples);
	}
}

class SampleModal extends Modal {
	public app: App;
	private form: Form;

	constructor(app: App, formFields: FormField[]) {
		super(app);

		this.app = app;
		this.form = new Form(this.contentEl, this.app, formFields);
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Report expense" });

		await this.form.createFormFields();

		new Setting(this.contentEl).addButton((button) =>
			button
				.setButtonText("Save expense")
				.setCta()
				.onClick(() => {
					const frontmatterProps = this.form.getDataAsFrontmatter();
					const formInputTimestamp = this.form.getTimestampNamingStrategy();
					this.close();

					this.app.vault.create(
						`expenses/${formInputTimestamp}.md`,
						frontmatterProps
					);
				})
		);
	}

	onClose() {
		this.form.setFormDataNull();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
