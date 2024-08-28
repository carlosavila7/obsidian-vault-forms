export function getClassNamesFromExpression(expression: string): string[] {
	const classNameMatcher = new RegExp(/\$\$\.([0-9a-zA-Z-\-]+)/, "g");
	let matches = undefined;
	const formFieldClassNames = [];

	while ((matches = classNameMatcher.exec(expression)) !== null)
		formFieldClassNames.push(matches[1]);

	return formFieldClassNames;
}
