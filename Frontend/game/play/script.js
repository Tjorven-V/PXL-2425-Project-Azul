import APIEndpoints from '../../scripts/util/APIEndpoints.js';
import Board from "../../scripts/classes/Board.js";
import FactoryDisplay from "../../scripts/classes/FactoryDisplay.js";
import AuthenticationManager from "../../scripts/classes/AuthenticationManager.js";
import { ResourceManager, updateImagePaths, setSkin, selectedSkin } from "../../scripts/classes/ResourceManager.js";
import TableCenter from "../../scripts/classes/TableCenter.js";

export const gameState = {
    hasTilesToPlace: false,
    currentSelection: null,
    factories: {},
    boards: {},
    currentGame: null,
    afkLastActive: 0,
    afkWarningSent: false
};

document.addEventListener("DOMContentLoaded", () => {
    updateGameDisplays();
    initGame();
    setupEventListeners();
    waitForResources();
    setInterval(updateBoards, 1000);

    const systemMessagesDiv = document.getElementById('system-messages');
    const container = systemMessagesDiv ? systemMessagesDiv.querySelector('.messages-container') : null;
    if (systemMessagesDiv && container && container.children.length === 0) {
        systemMessagesDiv.style.display = 'none';
    }
});

async function updateBoards() {
    try {
        const game = await getGame();
        if (!game) return;

        game.players?.forEach(player => {
            if (!gameState.boards[player.id]) {
                const isLocal = player.id === AuthenticationManager.LoggedInUser?.id;
                gameState.boards[player.id] = new Board(player.id, player.name, isLocal);

                const container = isLocal ?
                    document.getElementById("player-board-container") :
                    document.getElementById("opponent-boards-container");
                container.appendChild(gameState.boards[player.id].Canvas);
            }
            const board = gameState.boards[player.id];
            board.IsCurrentPlayer = (player.id === game.playerToPlayId);
            board.BoardData = player.board;
            board.Paint();
        });

        const factoryContainer = document.getElementById("factory-displays-container");
        factoryContainer.innerHTML = '';
        gameState.factories = {};
        game.tileFactory?.displays?.forEach(display => {
            if (display.tiles?.length === 0) return;
            const factory = new FactoryDisplay(display.id);
            factory.Tiles = display.tiles;
            factory.Paint(game.playerToPlayId === AuthenticationManager.LoggedInUser?.id);
            factoryContainer.appendChild(factory.Canvas);
            gameState.factories[factory.Id] = factory;
        });

        const tableCenterContainer = document.getElementById("table-center-container");
        tableCenterContainer.innerHTML = '';
        if (game.tileFactory?.tableCenter?.tiles?.length > 0) {
            const tableCenter = new TableCenter(game.tileFactory.tableCenter.id);
            tableCenter.Tiles = game.tileFactory.tableCenter.tiles;
            tableCenterContainer.appendChild(tableCenter.Canvas);
        }

        if (game.playerToPlayId === AuthenticationManager.LoggedInUser?.id) {
            if (!gameState.afkLastActive) {
                gameState.afkLastActive = Date.now();
                gameState.afkWarningSent = false;
            } else {
                const inactiveTime = Date.now() - gameState.afkLastActive;

                if (inactiveTime > 90000) {
                    handleAFKTimeout();
                    gameState.afkLastActive = Date.now();
                    gameState.afkWarningSent = false;
                }
                else if (inactiveTime > 80000 && !gameState.afkWarningSent) {
                    displaySystemMessage("AFK detected! Auto-move in 10 seconds...", false);
                    gameState.afkWarningSent = true;
                }
            }
        } else {
            gameState.afkLastActive = 0;
            gameState.afkWarningSent = false;
        }

    } catch (error) {
        displaySystemMessage("Updating board error:" + error);
    }
}

async function handleAFKTimeout() {
    try {
        gameState.currentSelection = null;
        const game = await getGame();
        if (!game) return;

        let displayId = null;
        let tileType = null;

        const availableFactory = game.tileFactory.displays.find(
            display => display.tiles?.length > 0
        );

        if (availableFactory) {
            displayId = availableFactory.id;
            tileType = availableFactory.tiles[0];
        } else {
            const validCenterTiles = game.tileFactory.tableCenter.tiles.filter(t => t !== 0);
            if (validCenterTiles.length === 0) {
                displaySystemMessage("No tiles available?");
                return;
            }
            displayId = game.tileFactory.tableCenter.id;
            tileType = validCenterTiles[0];
        }

        const takeResult = await takeTiles(displayId, tileType);
        if (!takeResult.success) throw new Error("Failed to take tiles");

        const placeResult = await placeTilesOnFloorLine();
        if (!placeResult.success) throw new Error("Failed to place tiles");

        displaySystemMessage("AFK turn completed automatically", false);
        await updateBoards();

    } catch (error) {
        displaySystemMessage("AFK handling failed: " + error.message);
    }
}

function updateGameDisplays() {
    const gameInfo = document.getElementById("game-information");
    const loadingSubtitle = document.querySelector("#loading-resources .subtitle");
    const gameId = sessionStorage.getItem("gameId") || 'N/A';
    const playerName = AuthenticationManager.LoggedInUser?.userName || 'N/A';

    if (gameInfo) {
        gameInfo.innerHTML = `Game: ${gameId}<br><br>Player: ${playerName}`;
        gameInfo.style.display = "block";
    }
    if (loadingSubtitle) {
        loadingSubtitle.innerHTML = `Game: ${gameId}<br><br>Playing as: ${playerName}`;
    }
}

function setupEventListeners() {
    document.getElementById("skin-selector").addEventListener("change", changeSkin);
    document.addEventListener('factoryTileSelected', handleFactorySelection);
    document.addEventListener('patternLineSelected', handlePatternLineSelection);
    document.addEventListener('floorLineSelected', handleFloorLineSelection);
}

async function handleFloorLineSelection(e) {

    const currentPlayerId = AuthenticationManager.LoggedInUser?.id;
    if (!gameState.currentGame || gameState.currentGame.playerToPlayId !== currentPlayerId) {
        displaySystemMessage("Not your turn");
        return;
    }

    if (!gameState.hasTilesToPlace) {
        displaySystemMessage("No tiles selected.");
        return;
    }

    try {
        const takeResult = await takeTiles(gameState.currentSelection.displayId, gameState.currentSelection.tileType);
        if (!takeResult.success) throw new Error("Failed to take tiles");

        const placeResult = await placeTilesOnFloorLine();
        if (placeResult.success) {
            gameState.hasTilesToPlace = false;
            resetSelections();
            loadBoards();
        }
    } catch (error) {
        displaySystemMessage("Floor line placement failed:" + error.message);
    }
}

async function takeTiles(displayId, tileType) {
    try {
        const gameId = sessionStorage.getItem('gameId');
        const response = await fetch(APIEndpoints.TakeTiles.replace("{id}", gameId), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AuthenticationManager.Token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                displayId,
                tileType,
                moveRemainingToCenter: false
            })
        });

        if (!response.ok) throw new Error(await response.text());
        return { success: true };

    } catch (error) {
        displaySystemMessage("TakeTiles failed:" + error);
        return { success: false };
    }
}

async function placeTilesOnPatternLine(patternLineIndex) {
    try {
        const gameId = sessionStorage.getItem('gameId');
        if (!gameId) {
            displaySystemMessage('No game ID found');
            return { success: false };
        }
        const game = await getGame();
        if (!game) {
            displaySystemMessage("Couldn't validate game state");
            return { success: false };
        }

        const currentPlayer = game.players.find(p => p.id === AuthenticationManager.LoggedInUser?.id);
        const board = gameState.boards[currentPlayer.id];

        const validation = board.validatePatternLinePlacement(patternLineIndex, gameState.currentSelection.tileType);
        if (!validation.valid) {
            displaySystemMessage(validation.error);
            return { success: false };
        }

        displaySystemMessage("Sending placeTiles request...");
        const response = await fetch(APIEndpoints.PlaceTilesPatternLine.replace("{id}", gameId), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AuthenticationManager.Token}`
            },
            body: JSON.stringify({ patternLineIndex })
        });

        if (!response.ok) {
            const error = await response.json();
            displaySystemMessage("PlaceTiles failed:", error.message);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        displaySystemMessage("PlaceTiles error:" + error);
        return { success: false, error: error.message };
    }
}

async function handleFactorySelection(e) {
    const { displayId, tileType, tileCount } = e.detail;
    const currentPlayerId = AuthenticationManager.LoggedInUser?.id;

    if (!gameState.currentGame || gameState.currentGame.playerToPlayId !== currentPlayerId) {
        displaySystemMessage("Not your turn");
        return;
    }

    if (gameState.currentSelection?.displayId === displayId &&
        gameState.currentSelection?.tileType === tileType) {
        gameState.currentSelection = null;
        gameState.hasTilesToPlace = false;
    } else {
        gameState.currentSelection = {
            displayId,
            tileType,
            tileCount
        };
        gameState.hasTilesToPlace = true;
    }
    loadBoards();
}

async function handlePatternLineSelection(e) {

    const currentPlayerId = AuthenticationManager.LoggedInUser?.id;
    if (!gameState.currentGame || gameState.currentGame.playerToPlayId !== currentPlayerId) {
        displaySystemMessage("Not your turn");
        return;
    }

    if (!gameState.hasTilesToPlace) {
        displaySystemMessage("Take tiles first!");
        return;
    }
    try {
        const takeResult = await takeTiles(gameState.currentSelection.displayId, gameState.currentSelection.tileType);
        if (!takeResult.success) throw new Error("Failed to take tiles");

        const placeResult = await placeTilesOnPatternLine(e.detail.patternLineIndex);

        if (placeResult.success) {
            gameState.hasTilesToPlace = false;
            resetSelections();
        }
    } catch (error) {
        displaySystemMessage("Placement failed:" + error.message);
    }
}

async function placeTilesOnFloorLine() {
    try {
        const gameId = sessionStorage.getItem('gameId');
        if (!gameId) {
            displaySystemMessage('No game ID found');
            return { success: false };
        }

        const response = await fetch(APIEndpoints.PlaceTilesFloorLine.replace("{id}", gameId), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AuthenticationManager.Token}`
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            const error = await response.json();
            displaySystemMessage("PlaceTilesFloorLine failed:", error.message);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        displaySystemMessage("PlaceTilesFloorLine error: " + error);
        return { success: false, error: error.message };
    }
}

function initGame() {
    const loadingResources = document.getElementById("loading-resources");
    const skinSelectorContainer = document.getElementById("skin-selector-container");
    const gameArea = document.getElementById("game-area");
    const gameInfoDiv = document.getElementById('game-information');

    if (skinSelectorContainer) skinSelectorContainer.style.display = "flex";
    if (gameInfoDiv) gameInfoDiv.style.display = "block";

    if (loadingResources) {
        loadingResources.classList.add("fade-out");
        setTimeout(() => {
            loadingResources.style.display = 'none';
        }, 500);
    }
    if (gameArea) gameArea.classList.add("fade-in");

    const initialSkin = document.getElementById("skin-selector") ? document.getElementById("skin-selector").value : 'azul';
    updateImagePaths(initialSkin);
    updateGameDisplays();
}

function waitForResources() {
    setSkin(document.getElementById("skin-selector").value, document.body);
    if (ResourceManager.AllLoaded) {
        loadBoards();
    } else {
        setTimeout(waitForResources, 100);
    }
}

async function getGame() {
    const gameId = sessionStorage.getItem('gameId');
    if (!gameId) return null;

    try {
        const response = await fetch(APIEndpoints.GameInfo.replace("{id}", gameId), {
            headers: { 'Authorization': `Bearer ${AuthenticationManager.Token}` }
        });
        if (response.ok) {
            gameState.currentGame = await response.json();
            return gameState.currentGame;
        }
        return null;
    } catch (error) {
        displaySystemMessage("Game fetch error: " + error);
        return null;
    }
}

async function loadBoards() {
    try {
        const game = await getGame();
        if (!game) return;

        game.players?.forEach(player => {
            if (!gameState.boards[player.id]) {
                const isLocal = player.id === AuthenticationManager.LoggedInUser?.id;
                gameState.boards[player.id] = new Board(player.id, player.name, isLocal);

                const container = isLocal ?
                    document.getElementById("player-board-container") :
                    document.getElementById("opponent-boards-container");
                container.appendChild(gameState.boards[player.id].Canvas);
            }
        });
        await updateBoards();
    } catch (error) {
        displaySystemMessage("Board loading error: " + error);
    }
}

function resetSelections() {
    gameState.currentSelection = null;
    gameState.hasTilesToPlace = false;
    Object.values(gameState.factories).forEach(f => f?.clearSelection());
    Object.values(gameState.boards).forEach(b => {
        if (b?.IsLocal) b.clearPatternLineSelection();
    });
}

function changeSkin() {
    const skin = document.getElementById("skin-selector").value;
    setSkin(skin, document.body);
    updateImagePaths(skin);
}

function displaySystemMessage(text, isError = true) {
    const systemMessagesDiv = document.getElementById('system-messages');
    const container = systemMessagesDiv ? systemMessagesDiv.querySelector('.messages-container') : null;

    if (!container || !systemMessagesDiv) {
        console.error("System messages container or div not found!");
        return;
    }

    const message = document.createElement('div');
    message.className = `system-message ${isError ? 'error' : 'info'}`;
    message.innerHTML = `[SYSTEM] ${text} <span class="timestamp">${new Date().toLocaleTimeString()}</span>`;

    container.appendChild(message);
    systemMessagesDiv.style.display = 'block';
    systemMessagesDiv.scrollTop = systemMessagesDiv.scrollHeight;

    setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => {
            message.remove();
            if (container.children.length === 0) {
                systemMessagesDiv.style.display = 'none';
            }
        }, 300);
    }, 5000);
}
