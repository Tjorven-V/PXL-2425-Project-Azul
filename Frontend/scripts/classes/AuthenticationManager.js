import {IncorrectCredentialsError, InvalidCredentialsError, MissingCredentialsError} from "./AuthErrors.js";
import APIEndpoints from "../util/APIEndpoints.js";

class AuthenticationManager {
    static async Register(email, password, userName, lastVisitToPortugal) {
        if (!email || !password || !userName) throw new MissingCredentialsError();
        if (typeof email !== 'string') throw new InvalidCredentialsError("Email must be a string.");
        if (typeof password !== 'string') throw new InvalidCredentialsError("Password must be a string.");
        if (typeof userName !== 'string') throw new InvalidCredentialsError("Username must be a string.");

        const response = await fetch(APIEndpoints.Register, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                password,
                userName,
                lastVisitToPortugal
            })
        });

        if (!response.ok) {
            const errorData = await response.json();

            if (errorData.message.includes('Email')) {
                throw new Error("Email already exists");
            } else if (errorData.message.includes('Username')) {
                throw new Error("Username already exists");
            }
            throw new Error(` Registration failed: ${response.status} ${errorData.message}`);
        }
    }

    static async Login(email, password) {
        if (!email || !password) throw new MissingCredentialsError();
        if (typeof email !== 'string') throw new InvalidCredentialsError("Authentication requires a string as email.");
        if (typeof password !== 'string') throw new InvalidCredentialsError("Authentication requires a string as password.");

        // don't use a try/catch block here, just let the errors propagate.
        const response = await fetch(APIEndpoints.Authentication, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            switch (response.status) {
                case 401: { // 401 is specifically returned if the credentials were incorrect
                    throw new IncorrectCredentialsError("Provided credentials did not match any user.");
                }
                default: {
                    throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
                }
            }
        }

        return await response.json();
    }

    static async RenewLogin(email, password) {
        // TODO: Implement
        throw new Error("AuthenticationManager.RenewLogin Not Implemented");

    }

    static get LoggedInUser() {
        // TODO: Implement retrieving currently logged in user
        throw new Error("AuthenticationManager.LoggedInUser Not Implemented");

    }


}

export default AuthenticationManager;

