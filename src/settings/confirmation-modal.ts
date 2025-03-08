import { App, Modal, Setting } from "obsidian";

interface ConfirmationModalParams {
	app: App;
	submitLabel: string;
	title: string;
	description: string;
	onSubmit: () => void;
}

export class ConfirmationModal extends Modal {
	private submitLabel: string;
	private title: string;
	private description: string;
	private onSubmit: () => void;

	constructor(params: ConfirmationModalParams) {
		super(params.app);

		this.submitLabel = params.submitLabel;
		this.title = params.title;
		this.description = params.description;
		this.onSubmit = params.onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: this.title });

		new Setting(contentEl).setDesc(this.description);

		new Setting(this.contentEl)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => this.close())
			)
			.addButton((btn) =>
				btn
					.setButtonText(this.submitLabel)
					.setWarning()
					.onClick(() => {
						this.onSubmit();
						this.close();
					})
			);
	}
}
