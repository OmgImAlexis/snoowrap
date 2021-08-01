export class RequiredArgumentError extends TypeError {
    constructor(argument: string) {
        super(`Missing required argument "${argument}"`);
    }
}
