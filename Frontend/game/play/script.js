import APIEndpoints from '../../scripts/util/APIEndpoints.js';
import Board from "../../scripts/classes/Board.js";
import FactoryDisplay from "../../scripts/classes/FactoryDisplay.js";
import AuthenticationManager from "../../scripts/classes/AuthenticationManager.js";
import { ResourceManager, updateImagePaths, setSkin, selectedSkin } from "../../scripts/classes/ResourceManager.js";
import TableCenter from "../../scripts/classes/TableCenter.js";

const gameState = {
    hasTilesToPlace: false,
    currentSelection: null,
    factories: {},
    boards: {},
    currentGame: null
};

document.addEventListener("DOMContentLoaded", () => {
    updateGameDisplays();
    initGame();
    setupEventListeners();
    waitForResources();
    setInterval(updateBoards, 1000);
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

    } catch (error) {
        displaySystemMessage("Updating board error:" + error);
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
        await placeTilesOnFloorLine();
        gameState.hasTilesToPlace = false;
        resetSelections();
        loadBoards();
    } catch (error) {
        displaySystemMessage("Floor line placement failed:" + error);
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
    const { displayId, tileType } = e.detail;
    const currentPlayerId = AuthenticationManager.LoggedInUser?.id;

    if (!gameState.currentGame || gameState.currentGame.playerToPlayId !== currentPlayerId) {
        displaySystemMessage("Not your turn");
        return;
    }
    Object.values(gameState.factories).forEach(f => f.clearSelection());

    if (gameState.hasTilesToPlace) {
        displaySystemMessage("Tiles already taken.");
        return;
    }

    try {
        const result = await takeTiles(displayId, tileType);
        if (result.success) {
            gameState.currentSelection = { displayId, tileType };
            gameState.hasTilesToPlace = true;

            loadBoards();
        }
    } catch (error) {
        displaySystemMessage("Take tiles failed:" + error);
    }
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
        const result = await placeTilesOnPatternLine(e.detail.patternLineIndex);

        if (result.success) {
            gameState.hasTilesToPlace = false;
            resetSelections();
        }
    } catch (error) {
        displaySystemMessage("Placement failed:" + error);
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
    const skinSelector = document.getElementById("skin-selector-container");

    skinSelector.style.display = "flex";
    skinSelector.style.justifyContent = "flex-end";
    loadingResources.classList.add("fade-out");
    document.getElementById("game-area").classList.add("fade-in");

    updateImagePaths(selectedSkin);
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
    const container = document.querySelector('#system-messages .messages-container');
    const message = document.createElement('div');

    message.className = `system-message ${isError ? 'error' : 'info'}`;
    message.innerHTML = `[SYSTEM] ${text} <span class="timestamp">${new Date().toLocaleTimeString()}</span>`;

    container.appendChild(message);

    setTimeout(() => {
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 300);
    }, 5000);
}