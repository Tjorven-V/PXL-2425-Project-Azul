const DESIGN_WIDTH = 1920; // Basisontwerp breedte van de game-inhoud
const DESIGN_HEIGHT = 1080;  // Basisontwerp hoogte van de game-inhoud

function scaleGame() {
    const gameViewport = document.getElementById('game-viewport');
    const navElement = document.querySelector('nav');
    if (!gameViewport) return;

    let navHeight = 0;
    if (navElement) {
        navHeight = navElement.offsetHeight;
    }

    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight - navHeight;

    const scaleX = availableWidth / DESIGN_WIDTH;
    const scaleY = availableHeight / DESIGN_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    gameViewport.style.width = `${DESIGN_WIDTH}px`;
    gameViewport.style.height = `${DESIGN_HEIGHT}px`;

    gameViewport.style.left = `${availableWidth / 2}px`;
    gameViewport.style.top = `${navHeight + (availableHeight / 2)}px`;

    gameViewport.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

document.addEventListener('DOMContentLoaded', () => {
    const gameViewport = document.getElementById('game-viewport');
    if (gameViewport) {
        gameViewport.style.position = 'fixed';
        gameViewport.style.transformOrigin = 'center center';
        gameViewport.style.overflow = 'hidden';
    }
    scaleGame();
});

window.addEventListener('resize', scaleGame);

if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
    scaleGame();
}