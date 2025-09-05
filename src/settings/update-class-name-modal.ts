import { App, Modal, Notice, Setting } from "obsidian";

export class UpdateClassNameModal extends Modal {
	private currentClassName: string;
	private onSubmit: (newClassName: string) => void;
	private existingClassNames: string[];

	constructor(
		app: App,
		currentClassName: string,
		existingClassNames: string[],
		onSubmit: (newClassName: string) => void
	) {
		super(app);
		this.currentClassName = currentClassName;
		this.onSubmit = onSubmit;
		this.existingClassNames = existingClassNames;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Update field class name" });
		contentEl.createEl("p", {
			text: "Will not update references to current class name in other fields expressions",
		});

		let inputValue = this.currentClassName;

		new Setting(contentEl)
			.setName("Class name")
			.setDesc("Non-alphanumeric characters will be replaced by '-'")
			.addText((txt) => {
				txt.setValue(this.currentClassName).onChange(
					(value) => (inputValue = value)
				);
			});

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Update")
				.setCta()
				.onClick(() => {
					if (inputValue !== this.currentClassName) {
						inputValue = inputValue
							.toLowerCase()
							.replace(/[^a-z0-9]/g, "-");
						if (this.existingClassNames.includes(inputValue)) {
							new Notice(
								`Class name "${inputValue}" already exists`
							);
							return;
						}
						this.onSubmit(inputValue);
					}
					this.close();
				})
		);
	}
}
