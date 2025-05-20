import AuthenticationManager from "./scripts/classes/AuthenticationManager.js";

const lobbyPageUrl = 'game/lobby/index.html';

function updateUserNavigation() {
    const navLinksContainer = document.querySelector('.nav-links');
    const loggedInUser = AuthenticationManager.LoggedInUser;

    if (!navLinksContainer) {
        console.error("Nav links container not found!");
        return;
    }

    if (loggedInUser) {
        const userName = loggedInUser.userName || loggedInUser.name || 'User';

        navLinksContainer.innerHTML = `
            <span style="color: #fff; margin-right: 15px; vertical-align: middle;">${userName}</span>
            <a href="#" id="logoutButtonLanding" class="register-btn" style="vertical-align: middle;">Logout</a>
        `;

        const logoutButtonElement = document.getElementById('logoutButtonLanding');
        if (logoutButtonElement) {
            logoutButtonElement.addEventListener('click', async (event) => {
                event.preventDefault();
                try {
                    if (typeof AuthenticationManager.logout === 'function') {
                        await AuthenticationManager.logout();
                    } else {
                        sessionStorage.removeItem("loggedInUser");
                        sessionStorage.removeItem("token");
                        localStorage.removeItem("loggedInUser");
                        localStorage.removeItem("token");
                    }
                    updateUserNavigation();
                    updateCtaButtonLinks();
                    window.location.reload();
                } catch (error) {
                    console.error("Logout failed:", error);
                }
            });
        }
    } else {
        navLinksContainer.innerHTML = `
            <a href="user/login/index.html">Login</a>
            <a href="user/register/index.html" class="register-btn">Sign Up</a>
        `;
    }
}

function updateCtaButtonLinks() {
    const loggedInUser = AuthenticationManager.LoggedInUser;
    const playOurGameHeaderButton = document.getElementById('playOurGameHeaderButton');
    const startGameCtaButton = document.getElementById('startGameCtaButton');

    if (loggedInUser) {
        if (playOurGameHeaderButton) {
            playOurGameHeaderButton.href = lobbyPageUrl;
        }
        if (startGameCtaButton) {
            startGameCtaButton.href = lobbyPageUrl;
        }
    } else {
        if (playOurGameHeaderButton) {
            playOurGameHeaderButton.href = 'user/login/index.html';
        }
        if (startGameCtaButton) {
            startGameCtaButton.href = 'user/login/index.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateUserNavigation();
    updateCtaButtonLinks();
});
