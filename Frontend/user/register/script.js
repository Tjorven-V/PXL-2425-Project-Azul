import {validateEmailFormat, validatePasswordFormat, validateUsernameFormat} from "../../scripts/util/Validation.js";
import AuthenticationManager from "../../scripts/classes/AuthenticationManager.js";
import Redirects from "../../scripts/util/Redirects.js";

const form = document.querySelector('form');
const antwoord = document.querySelector('#error');

// Event Listeners
form.elements['wachtwoord-verificatie'].addEventListener('input', validatePasswords);
form.elements['datum'].addEventListener('change', validateDate);
form.elements['userName'].addEventListener('input', validateUsername);
form.elements['email'].addEventListener('input', validateEmail);
form.addEventListener('submit', handleSubmit);
form.elements['portugal-check'].addEventListener("change", () => {
    if (!form.elements['portugal-check'].checked) {
        form.elements['datum'].value = "";
    }
});

// Wachtwoord Validatie
function validatePasswords() {
    if (form.elements['wachtwoord'].value !== form.elements['wachtwoord-verificatie'].value) {
        antwoord.textContent = "Passswords are unidentical.";
        antwoord.style.display = "flex";
        return false;
    } if (!validatePasswordFormat(form.elements['wachtwoord-verificatie'].value)) {
        antwoord.textContent = "Invalid password.";
        antwoord.style.display = "flex";
        return false;
    } else {
        antwoord.style.display = "none";
        return true;
    }
}

// Username Validatie
function validateUsername() {
    if (!validateUsernameFormat(form.elements['userName'].value)) {
        antwoord.textContent = "Invalid username.";
        antwoord.style.display = "flex";
    } else {
    antwoord.style.display = "none";
    return true;
    }
}
// Email Validatie
function validateEmail() {
    if (!validateEmailFormat(form.elements['email'].value)) {
        antwoord.textContent = "Invalid E-mail.";
        antwoord.style.display = "flex";
    } else {
    antwoord.style.display = "none";
    return true;
    }
}

// Datum Validatie
function validateDate() {
    const selectedDate = new Date(form.elements['datum'].value);
    const vandaag = new Date();

    if (selectedDate > vandaag) {
        antwoord.textContent = "Date can not be in the future";
        antwoord.style.display = "flex";
        setTimeout(() => {
            form.elements['datum'].value = '';
        }, 0);
        return false;
    } else {
        antwoord.style.display = "none";
        return true;
    }
}

// Submit
async function handleSubmit(e) {
    e.preventDefault();
    if (!validatePasswords() || !validateDate() || !validateUsername() || !validateEmail()) return;

    try {
        await AuthenticationManager.Register(
            form.elements['email'].value,
            form.elements['wachtwoord'].value,
            form.elements['userName'].value,
            form.elements['datum'].value || null
        );

        antwoord.style.color = "green";
        antwoord.style.display = "flex";
        antwoord.textContent = "Account successfully created! Have fun playing!";
        sessionStorage.setItem("email", form.elements['email'].value);
        form.querySelector('[type="submit"]').disabled = true;

        setTimeout(() => {
            window.location.href = Redirects.Login;
        }, 3000);

    } catch (error) {
        antwoord.textContent = error.message;
        antwoord.style.display = "flex";
    }
}