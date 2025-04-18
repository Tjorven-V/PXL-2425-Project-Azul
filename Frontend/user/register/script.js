const form = document.querySelector('form');
const antwoord = document.querySelector('#error');

// Event Listeners
form.elements['wachtwoord-verificatie'].addEventListener('input', validatePasswords);
form.elements['datum'].addEventListener('change', validateDate);
form.addEventListener('submit', handleSubmit);
form.elements['portugal-check'].addEventListener("change", () => {
    if (!form.elements['portugal-check'].checked) {
        form.elements['datum'].value = "";
    }
});

// Wachtwoord Validatie
function validatePasswords() {
    if (form.elements['wachtwoord'].value !== form.elements['wachtwoord-verificatie'].value) {
        antwoord.textContent = "Wachtwoorden zijn niet hetzelfde.";
        antwoord.style.display = "flex";
        return false;
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
        antwoord.textContent = "Datum mag niet in de toekomst liggen.";
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
    if (!validatePasswords() || !validateDate()) return;
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
                antwoord.textContent = "Account succesvol aangemaakt! Veel speel plezier!";
                form.querySelector('[type="submit"]').disabled = true;
                setTimeout(() => {
                    window.location.href = '../login'
                }, 3000);
                return;
            }

            // Only parse JSON for error responses
            return response.json().then(errData => {
                throw new Error(`Registratie mislukt: ${errData.message || response.status}`);
            });
        })
        .catch(error => {
            antwoord.textContent = error.message;
            antwoord.style.display = "flex";
        });
}