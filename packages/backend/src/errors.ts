export class DBDUpulicateError extends Error {
	constructor(message?: string) {
		super(message || "Duplicate entry in database");
		this.name = "DBDUpulicateError";
	}
}
