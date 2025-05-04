import { hideExpressionExample } from "_examples";
import { Plugin } from "obsidian";
import { Form, IForm } from "src/form";
import {
	FormBo,
	MyPluginSettings,
} from "src/settings/handle-form-modal.constants";
import { mySettingsTab } from "src/settings/settings-tab";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.saveSettings();
		await this.loadSettings();

		const formParams: IForm = {
			formFields: hideExpressionExample,
			title: "This is a form field",
			path: "expenses/",
			submitLabel: "Submit ribbon form",
		};

		this.addRibbonIcon("wallet", formParams.title, () => {
			new Form(this.app, formParams);
		});

		this.addSettingTab(new mySettingsTab(this));

		this.activateForms();
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

	private activateForms() {
		this.settings.forms?.forEach((form) => {
			if (form.active) this.addCommandForm(form);
		});
	}

	public addCommandForm(form: FormBo) {
		this.addCommand({
			id: form.id,
			name: form.title,
			callback: () => {
				new Form(this.app, form).open();
			},
		});
	}
}
