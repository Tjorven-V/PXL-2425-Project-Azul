import { IncorrectCredentialsError } from "../../scripts/classes/AuthErrors.js";
import Redirects from "../../scripts/util/Redirects.js";
import {validateEmailFormat, validatePasswordFormat} from "../../scripts/util/Validation.js";
import AuthenticationManager from "../../scripts/classes/AuthenticationManager.js";

let emailInput, emailInputMessage;
let passwordInput, passwordInputMessage;
let loginButton, loginMessage, rememberMeCheckbox;

function clearAllMessages() {
    emailInputMessage.replaceChildren();
    passwordInputMessage.replaceChildren();
    loginMessage.replaceChildren();
}

function autoFillLogin () {
    console.log(sessionStorage.getItem("email"))
    if (sessionStorage.getItem("email")) {
        document.getElementById('email').value = sessionStorage.getItem("email");
    }
}

// Prompt for the user to create an account if no credentials match the provided ones.
let registrationMessageElement = document.createElement("div");

let textBeforeLink = document.createTextNode("Visit the ");
let registrationLink = document.createElement("a");
registrationLink.setAttribute("href", "../register");
registrationLink.textContent = "registration page";
let textAfterLink = document.createTextNode(" to create an account.");

registrationMessageElement.appendChild(textBeforeLink);
registrationMessageElement.appendChild(registrationLink);
registrationMessageElement.appendChild(textAfterLink);
// ------


function redirectToProfile() {
    let targetUrl = Redirects.OwnProfile;
    console.log("Redirecting to " + targetUrl);

    setTimeout(() => {
        window.location.href = targetUrl;
    }, 1000);
}

function showWelcomeBackMessage(username) {
    let loginForm = document.getElementById("login-form");
    let loginContainer = document.getElementById("login-form-container");

    loginForm.replaceChildren();
    loginContainer.appendChild(
        document.createTextNode(`Welcome back, ${username}! Redirecting you...`)
    );
}

async function login() {
    console.log("Attempting to login...");
    clearAllMessages();

    // TODO: More clear errors for validation failure?
    if (!validateEmailFormat(emailInput?.value)) {
        console.error("Email validation failed");
        emailInputMessage.appendChild(document.createTextNode("Please enter a valid email address"));
        return;
    }

    if (!validatePasswordFormat(passwordInput?.value)) {
        console.log("Password validation failed");
        passwordInputMessage.appendChild(document.createTextNode("Password must be at least 6 characters"));
        return;
    }

    loginButton.disabled = true;
    try {
        // this will throw an error if it fails
        let loggedInUser = await AuthenticationManager.Login(emailInput?.value, passwordInput?.value);
        showWelcomeBackMessage(loggedInUser.user.userName);
        redirectToProfile();
    } catch (e) {
        console.error("Login failed: " + e);

        loginButton.disabled = false;
        loginMessage.replaceChildren();
        if (e instanceof IncorrectCredentialsError) {
            loginMessage.appendChild(document.createTextNode("The provided credentials did not match any on record."));
            loginMessage.appendChild(registrationMessageElement);
        } else {
            loginMessage.appendChild(document.createTextNode("Something went wrong, but we're not sure what."));
        }
    }
}

window.addEventListener('load', async function () {
    loginButton = document.getElementById('login-button');
    loginMessage = document.getElementById('login-message');

    emailInput = document.getElementById('email');
    emailInputMessage = document.getElementById('email-message');

    passwordInput = document.getElementById('password');
    passwordInputMessage = document.getElementById('password-message');

    rememberMeCheckbox = document.getElementById('remember-me');

    let enterPress = (e) => {
        if (e.key !== "Enter") return;
        loginButton.click(); // simulate button click instead, no extra code needed to check if disabled.
    };

    loginButton.addEventListener('click', login);
    emailInput.addEventListener('keyup', enterPress);
    passwordInput.addEventListener('keyup', enterPress);

    autoFillLogin();
});
