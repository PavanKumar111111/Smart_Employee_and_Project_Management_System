export class BackendDownError extends Error {
    constructor() {
        super('Cannot connect to server');
        this.name = 'BackendDownError';
    }
}