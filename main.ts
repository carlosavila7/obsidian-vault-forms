import { Plugin } from "obsidian";
import { Form } from "src/form";
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

		this.addSettingTab(new mySettingsTab(this));

		this.activateForms();
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private activateForms() {
		this.settings.forms?.forEach((form) => {
			if (form.active) this.addCommandForm(form);
			if (form.showRibbonIcon) this.addRibbonForm(form);
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

	public addRibbonForm(form: FormBo) {
		if (form.ribbonRef?.remove) form.ribbonRef.remove();

		form.ribbonRef = this.addRibbonIcon(
			form.ribbonIconName ?? "circle",
			form.title,
			(_) => new Form(this.app, form).open()
		);
	}
}
