import {validateEmailFormat, validatePasswordFormat, validateUsernameFormat} from "../../scripts/util/Validation.js";

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
function handleSubmit(e) {
    e.preventDefault();
    if (!validatePasswords() || !validateDate() || !validateUsername() || !validateEmail()) return;
    let url = 'https://localhost:5051/api/Authentication/register';
    let person = {
        email: form.elements['email'].value,
        userName: form.elements['userName'].value,
        password: form.elements['wachtwoord'].value,
        lastVisitToPortugal: form.elements['datum'].value || null
    }
    fetch(url, {
        method: 'POST',
        body: JSON.stringify(person),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.ok) {
                antwoord.style.color = "green";
                antwoord.style.display = "flex";
                antwoord.textContent = "Account successfully created! Have fun playing!";
                sessionStorage.setItem("email",form.elements['email'].value);
                form.querySelector('[type="submit"]').disabled = true;
                setTimeout(() => {
                    window.location.href = '../login'
                }, 3000);
                return;
            }

            return response.json().then(errData => {
                throw new Error(`Registration failed: ${errData.message || response.status}`);
            });
        })
        .catch(error => {
            antwoord.textContent = error.message;
            antwoord.style.display = "flex";
        });
}