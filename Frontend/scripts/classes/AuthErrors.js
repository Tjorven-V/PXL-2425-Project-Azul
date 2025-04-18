/**
 * Error thrown when invalid credentials were provided. (ex. An array as password.)
 * @memberof module:User Authentication
 */
class InvalidCredentialsError extends Error {
    constructor(message) {
        super(message);
        this.name = "InvalidCredentialsError";
    }
}

/**
 * Error thrown when the remote API rejects the provided credentials, likely because they are incorrect.
 * @memberof module:User Authentication
 */
class IncorrectCredentialsError extends Error {
    constructor(message) {
        super(message);
        this.name = "IncorrectCredentialsError";
    }
}

/**
 * Error thrown when no (or insufficient) credentials were provided. (ex. Missing e-mail or password.)
 * @memberof module:User Authentication
 */
class MissingCredentialsError extends Error {
    constructor(message) {
        super(message);
        this.name = "MissingCredentialsError";
    }
}

export {
    InvalidCredentialsError,
    IncorrectCredentialsError,
    MissingCredentialsError
}