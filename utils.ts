export function getClassNamesFromExpression(expression: string): string[] {
	const classNameMatcher = new RegExp(/\$\$\.([0-9a-zA-Z-\-]+)/, "g");
	let matches = undefined;
	const formFieldClassNames = [];

	while ((matches = classNameMatcher.exec(expression)) !== null)
		formFieldClassNames.push(matches[1]);

	return formFieldClassNames;
}

export function getFilePathsFromExpression(expression: string): string[] {
	const filePathMatcher = new RegExp(/%%([^%%]*)%%/, "g");

	let matches = undefined;
	const filePaths = [];

	while ((matches = filePathMatcher.exec(expression)) !== null)
		filePaths.push(matches[1]);

	return filePaths;
}

export function fromArrayToRecord(array?: string[]): Record<string, string> {
	if(!array) return {};

	const record: Record<string, string> = {};

	array.map((item) => {
		record[item] = item;
	});

	return record;
}
