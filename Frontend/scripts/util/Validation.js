/**
 * The Validation module contains functions and definitions used to validate user input and sanitise it whenever it is to be displayed.
 * @module Validation
 *
 * @example
 * import v from 'Validation.js';
 *
 * // Validate email and password are valid and meet requirements
 * v.validateEmailFormat("user@example.org");
 * v.validatePasswordFormat("hunter2");
 */

/**
 * Simple RegEx pattern for basic email validation.
 * Matches standard emails like 'user@example.org'.
 * Does not support quoted or international formats.

 * @const {RegExp}
 * @example
 * new RegExp("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
 */
const simpleEmailRegex = new RegExp("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
/**
 * Validates that the provided string is a valid email. This uses a simplified e-mail RegEx.
 * @memberof module:Validation
 * @param {String} email The email to validate.
 * @returns {boolean}
 *
 * @example
 * import v from 'Validation.js';
 *
 * v.validateEmailFormat("user@example.org"); // true
 * v.validateEmailFormat("user.example.org"); // false, no @
 * v.validateEmailFormat(""); // false, no email
 */
function validateEmailFormat(email) {
    if (email === null || typeof email !== 'string' || email.trim().length === 0) return false;
    return email.match(simpleEmailRegex) !== null;
}

/**
 * Validates that the provided password is valid and meets requirements.
 * @memberof module:Validation
 * @param {String} password The password to validate.
 * @returns {boolean}
 *
 * @example
 * import v from 'Validation.js';
 *
 * v.validatePasswordFormat("hunter2"); // true, not strong but valid nonetheless
 * v.validatePasswordFormat("2short"); // false, 6 characters is too short
 * v.validatePasswordFormat(""); // false, no password
 */
function validatePasswordFormat(password) {
    if (password === null || typeof password !== 'string' || password.trim().length === 0) return false;
    return password.length >= 6;
}

/**
 * RegEx pattern for username validation.
 * This validates that the username:
 * <ul>
 *     <li>Starts with ONE underscore, OR any alphanumerical character</li>
 *     <li>Only contains ONE consecutive period, underscore or dash, otherwise is only alphanumerical</li>
 *     <li>Ends with ONE underscore, OR any alphanumerical character</li>
 * </ul>

 * @const {RegExp}
 * @example
 * new RegExp("^[A-Za-z0-9]+([._-][A-Za-z0-9]+)*$");
 */
const usernameRegex = new RegExp("^[A-Za-z0-9]+([._-][A-Za-z0-9]+)*$");

/**
 * Validates the provided username passes validation checks
 * @memberof module:Validation
 * @param {String} username The email to validate.
 * @returns {boolean}
 *
 * @example
 * import v from 'Validation.js';
 *
 * // These all pass
 * v.validateUsername('Hello-World');
 * v.validateUsername('xX_Pro-Gamer-123_Xx');
 * v.validateUsername('tj.v03');
 *
 * // These all fail
 * v.validateUsername('<script>');
 * v.validateUsername('; SELECT;--');
 * v.validateUsername(':(){ :|:& };:');
 */
function validateUsernameFormat(username) {
    if (username === null || typeof username !== 'string') return false;

    let usernameLength = username.length;
    if (usernameLength < 3 || 16 < usernameLength) return false;
    return username.match(usernameRegex) !== null;
}

export {
    validatePasswordFormat,
    validateEmailFormat,
    validateUsernameFormat
}