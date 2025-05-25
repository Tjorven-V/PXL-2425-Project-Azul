document.addEventListener('DOMContentLoaded', () => {
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    const snesContainer = document.getElementById('snes');
    const gameCanvasContainer = document.getElementById('game-canvas-container');
    const gameContainerEJS = document.getElementById('game-container-ejs');
    let gameElement = document.getElementById('game');
    const currentGameTitleElement = document.getElementById('current-game-title');
    const closeGameButton = document.getElementById('close-game-button');
    const gameCards = document.querySelectorAll('.game-card');

    let currentLoaderScript = null;

    if (!snesContainer || !gameCanvasContainer || !gameContainerEJS || !gameElement || !closeGameButton || !currentGameTitleElement) {
        console.error("One or more critical page elements are missing from the DOM. Check IDs in Frontend/game/files/index.html");
        console.error({
            snesContainerExists: !!snesContainer,
            gameCanvasContainerExists: !!gameCanvasContainer,
            gameContainerEJSExists: !!gameContainerEJS,
            gameElementExists: !!gameElement,
            closeGameButtonExists: !!closeGameButton,
            currentGameTitleElementExists: !!currentGameTitleElement
        });
        const mainContainer = document.querySelector('main.container');
        if (mainContainer) {
            mainContainer.innerHTML = '<p style="color: red; text-align: center; font-size: 1.2em; padding: 20px;">Error: Critical page elements are missing. Please try refreshing or contact support. Check console for details.</p>';
        }
        return;
    }

    gameCards.forEach(card => {
        card.addEventListener('click', () => {
            const romName = card.dataset.rom;
            const coreName = card.dataset.core;
            const gameTitle = card.dataset.name;

            snesContainer.style.display = 'none';
            gameCanvasContainer.style.display = 'block';
            currentGameTitleElement.textContent = `Loading: ${gameTitle}...`;

            if (!gameElement || !document.body.contains(gameElement)) {
                if (gameElement) gameElement.remove();
                gameElement = document.createElement('div');
                gameElement.id = 'game';
                if (gameContainerEJS) {
                    gameContainerEJS.appendChild(gameElement);
                } else {
                    console.error("#game-container-ejs not found! Cannot append #game div.");
                    currentGameTitleElement.textContent = `Error: Game container missing for ${gameTitle}`;
                    return;
                }
            } else {
                gameElement.innerHTML = '';
            }

            if (currentLoaderScript) {
                currentLoaderScript.remove();
                currentLoaderScript = null;
            }

            for (const key in window) {
                if (key.startsWith('EJS_')) {
                    delete window[key];
                }
            }
            delete window.Module;
            // delete window.EJS_CleanUp;
            // delete window.ejs_instance;

            const romPath = `files/roms/${romName}`;
            console.log(`Selected game: ${gameTitle}, ROM path: ${romPath}, Core: ${coreName}`);

            window.EJS_player = '#game';
            window.EJS_core = coreName;
            window.EJS_gameUrl = romPath;

            window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
            console.log("EJS_pathtodata is set to CDN: 'https://cdn.emulatorjs.org/stable/data/'");

            window.EJS_startOnLoaded = true;

            currentLoaderScript = document.createElement('script');

            currentLoaderScript.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
            currentLoaderScript.async = true;
            document.body.appendChild(currentLoaderScript);

            currentLoaderScript.onload = () => {
                console.log(`CDN EmulatorJS loader.js loaded for ${gameTitle}. Emulator should be starting.`);
                currentGameTitleElement.textContent = `${gameTitle}`;
            };
            currentLoaderScript.onerror = () => {
                console.error("Failed to load EmulatorJS loader.js from CDN. Check internet connection and ad-blockers.");
                currentGameTitleElement.textContent = `Error: Could not load emulator for ${gameTitle}`;
                if (gameElement) gameElement.innerHTML = '<p style="color:orange; text-align:center; padding: 20px;">Failed to load files components from CDN. Please check your internet connection.</p>';
            };
        });
    });

    closeGameButton.addEventListener('click', () => {
        window.location.reload();
    });
});
