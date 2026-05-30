export function normalizeName(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[\u2018\u2019\u02bc']/g, "")
		.replace(/[\u2010-\u2015\u2212\-\s]+/g, "");
}
