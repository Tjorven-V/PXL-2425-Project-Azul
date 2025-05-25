import APIEndpoints from '../../scripts/util/APIEndpoints.js';
import Board from "../../scripts/classes/Board.js";
import FactoryDisplay from "../../scripts/classes/FactoryDisplay.js";
import AuthenticationManager from "../../scripts/classes/AuthenticationManager.js";
import {ResourceManager, setSkin, updateImagePaths} from "../../scripts/classes/ResourceManager.js";
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
    updateUserNavigation();
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


function updateUserNavigation() {
    const navLinksContainer = document.querySelector('nav .nav-container .nav-links');
    const loggedInUser = AuthenticationManager.LoggedInUser;

    if (!navLinksContainer) {
        console.error("Nav links container not found! Check selector.");
        return;
    }

    const homeLinkHTML = `
        <a href="../../index.html" class="nav-link-item home-icon-link" title="Home">
            <span class="home-icon-symbol">&#x1F3E0;</span> Home
        </a>`;

    let userSpecificLinksHTML = '';
    if (loggedInUser) {
        const userName = loggedInUser.userName || loggedInUser.name || 'User';
        userSpecificLinksHTML = `
            <span class="nav-username">${userName}</span>
            <a href="#" id="logoutButton" class="nav-link-item game-logout-button">Logout</a>
        `;
    } else {
        userSpecificLinksHTML = `
            <a href="../../user/login/index.html" class="nav-link-item game-login-button">Login</a>
            <a href="../../user/register/index.html" class="nav-link-item register-btn">Sign Up</a>
        `;
    }
    const navLinksLeftHTML = `<div class="nav-links-left">${homeLinkHTML}${userSpecificLinksHTML}</div>`;

    const leaveButtonHTML = '<a href="#" id="leave-table-button" class="nav-link-item game-leave-button">Leave</a>';
    const skinSelectorHTML = `
        <div id="skin-selector-container-nav">
            <label for="skin-selector">Skin:</label>
            <select id="skin-selector">
                <option value="azul">Azul (Default)</option>
                <option value="minecraft">Minecraft</option>
                <option value="goofy">goofy</option>
            </select>
        </div>`;
    const navLinksRightHTML = `<div class="nav-links-right">${leaveButtonHTML}${skinSelectorHTML}</div>`;

    navLinksContainer.innerHTML = navLinksLeftHTML + navLinksRightHTML;

    const newSkinSelectorElement = document.getElementById("skin-selector");
    if (newSkinSelectorElement) newSkinSelectorElement.addEventListener("change", changeSkin);

    const newLeaveButtonElement = document.getElementById("leave-table-button");
    if (newLeaveButtonElement) {
        newLeaveButtonElement.addEventListener("click", async (event) => {
            event.preventDefault();
            await leaveTable();
        });
    }

    if (loggedInUser) {
        const logoutButtonElement = document.getElementById('logoutButton');
        if (logoutButtonElement) {
            logoutButtonElement.addEventListener('click', async (event) => {
                event.preventDefault();
                try {
                    await AuthenticationManager.logout();
                    window.location.href = '../../index.html';
                } catch (error) {
                    console.error("Logout failed:", error);
                }
            });
        }
    }
}

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
                } else if (inactiveTime > 80000 && !gameState.afkWarningSent) {
                    displaySystemMessage("AFK detected! Auto-move in 10 seconds...");
                    gameState.afkWarningSent = true;
                }
            }
        } else {
            gameState.afkLastActive = 0;
            gameState.afkWarningSent = false;
        }

    } catch (error) {
        console.log("Updating board error:" + error);
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
                console.log("No tiles available?");
                return;
            }
            displayId = game.tileFactory.tableCenter.id;
            tileType = validCenterTiles[0];
        }

        const takeResult = await takeTiles(displayId, tileType);
        if (!takeResult.success) throw new Error("Failed to take tiles");

        const placeResult = await placeTilesOnFloorLine();
        if (!placeResult.success) throw new Error("Failed to place tiles");

        displaySystemMessage("AFK turn completed automatically...", false);
        await updateBoards();

    } catch (error) {
        console.log("AFK handling failed: " + error.message);
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
    document.getElementById("leave-table-button").addEventListener("click", leaveTable);
    document.addEventListener('factoryTileSelected', handleFactorySelection);
    document.addEventListener('patternLineSelected', handlePatternLineSelection);
    document.addEventListener('floorLineSelected', handleFloorLineSelection);
}

async function leaveTable() {
    const tableId = sessionStorage.getItem("tableId")

    try {
        const response = await fetch(APIEndpoints.Leave.replace("{id}", tableId), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AuthenticationManager.Token}`
            },
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }

        sessionStorage.removeItem('gameId')
        window.location.href = "../../index.html";
    } catch (e) {
        console.error('Failed to leave the table:', e)
    }
    await checkAmountOfPlayers()
}

//
// async function checkAmountOfPlayers(){
//     const gameId = sessionStorage.getItem("gameId")
//     if(!gameId) return;
//
//     try{
//         const response = fetch(APIEndpoints.GameInfo.replace("{id}", gameId), {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${AuthenticationManager.Token}`
//             }
//         })
//
//         if(!response.ok){
//             throw new Error("Failed to fetch game info");
//         }
//
//         const gameData = await response.json();
//
//         if (gameData.players === 1 && !gameData.hasEnded){
//             const response = await fetch(APIEndpoints.GameInfo.replace("{id}", gameId), {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${AuthenticationManager.Token}`
//                 },
//                 body: JSON.stringify({hasEnded: true})
//             })
//             if (!response.ok) {
//                 throw new Error("Failed to fetch game info");
//             }
//         }
//
//     }catch(e){
//         console.error(e)
//     }
//     return console.log('Enough players to continue.');
//
// }

async function handleFloorLineSelection(e) {

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

        const placeResult = await placeTilesOnFloorLine();
        if (placeResult.success) {
            gameState.hasTilesToPlace = false;
            resetSelections();
            loadBoards();
        }
    } catch (error) {
        console.log("Floor line placement failed:" + error.message);
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
        return {success: true};

    } catch (error) {
        console.log("TakeTiles failed:" + error);
        return {success: false};
    }
}

async function placeTilesOnPatternLine(patternLineIndex) {
    try {
        const gameId = sessionStorage.getItem('gameId');
        if (!gameId) {
            displaySystemMessage('No game ID found');
            return {success: false};
        }
        const game = await getGame();
        if (!game) {
            console.log("Couldn't validate game state");
            return {success: false};
        }

        const currentPlayer = game.players.find(p => p.id === AuthenticationManager.LoggedInUser?.id);
        const board = gameState.boards[currentPlayer.id];

        const validation = board.validatePatternLinePlacement(patternLineIndex, gameState.currentSelection.tileType);
        if (!validation.valid) {
            displaySystemMessage(validation.error);
            return {success: false};
        }

        const takeResult = await takeTiles(gameState.currentSelection.displayId, gameState.currentSelection.tileType);
        if (!takeResult.success) throw new Error("Failed to take tiles");

        console.log("Sending placeTiles request...");
        const response = await fetch(APIEndpoints.PlaceTilesPatternLine.replace("{id}", gameId), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AuthenticationManager.Token}`
            },
            body: JSON.stringify({patternLineIndex})
        });

        if (!response.ok) {
            const error = await response.json();
            console.log("PlaceTiles failed:" + error.message);
            return {success: false, error: error.message};
        }

        return {success: true};
    } catch (error) {
        console.log("PlaceTiles error:" + error);
        return {success: false, error: error.message};
    }
}

async function handleFactorySelection(e) {
    const {displayId, tileType, tileCount} = e.detail;
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
        const placeResult = await placeTilesOnPatternLine(e.detail.patternLineIndex);

        if (placeResult.success) {
            gameState.hasTilesToPlace = false;
            resetSelections();
        }
    } catch (error) {
        console.log("Placement failed:" + error.message);
    }
}

async function placeTilesOnFloorLine() {
    try {
        const gameId = sessionStorage.getItem('gameId');
        if (!gameId) {
            displaySystemMessage('No game ID found');
            return {success: false};
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
            console.log("PlaceTilesFloorLine failed:" + error.message);
            return {success: false, error: error.message};
        }

        return {success: true};
    } catch (error) {
        console.log("PlaceTilesFloorLine error: " + error);
        return {success: false, error: error.message};
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
            headers: {'Authorization': `Bearer ${AuthenticationManager.Token}`}
        });
        if (response.ok) {
            gameState.currentGame = await response.json();
            return gameState.currentGame;
        }
        return null;
    } catch (error) {
        console.log("Game fetch error: " + error);
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
        console.log("Board loading error: " + error);
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
    const gameId = sessionStorage.getItem("gameId") || 'N/A';
    const chatStatus = document.getElementById("chat-status");
    const playerId = AuthenticationManager.LoggedInUser?.id;

    if (!isError) {
        fetch(APIEndpoints.SendChatMessage.replace("{id}", gameId), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AuthenticationManager.Token}`
            },
            body: JSON.stringify({playerId, message: text})
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(errorText => {
                        console.error('API Error:', errorText);
                    });
                }
            })
            .catch(error => {
                console.error('Fetch Error:', error);
            });
    } else {
        chatStatus.textContent = text;
    }
}