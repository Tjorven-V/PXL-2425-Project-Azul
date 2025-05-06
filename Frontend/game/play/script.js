import APIEndpoints from '../../scripts/util/APIEndpoints.js';
import Board from "../../scripts/classes/Board.js";
import FactoryDisplay from "../../scripts/classes/FactoryDisplay.js";
import AuthenticationManager from "../../scripts/classes/AuthenticationManager.js";

import ResourceManager from "../../scripts/classes/ResourceManager.js";

const c = setInterval(() => {
    if (ResourceManager.AllLoaded) {
        document.getElementById("loading-resources").style.display = "none";
        clearInterval(c);
        loadBoards();
    }
}, 100);

async function getGame(){
    let gameId;
    if (sessionStorage.getItem('gameId')) {
        gameId = sessionStorage.getItem('gameId');
    }
    if(gameId == null){
        throw new Error('No gameId found.');
    }
    let response = await fetch(APIEndpoints.GameInfo.replace("{id}", gameId), {
        headers: { 'Authorization': `Bearer ${AuthenticationManager.Token}` }
    })
    return response.json();
}

let playerBoards = {};
function loadBoards() {
    getGame().then(game => {
        let remoteBoards = document.getElementById("remote-boards-container");
        let factoryDisplaysContainer = document.getElementById("factory-displays-container");

        for (let factoryDisplay of game.tileFactory.displays) {
            let factory = new FactoryDisplay(factoryDisplay.id);
            factory.Tiles = factoryDisplay.tiles;
            let cvElement = factory.CreateCanvasElement();

            factoryDisplaysContainer.append(cvElement);

            factory.Paint();
        }

        for (let player of game.players) {
            let isLocal = player.id === AuthenticationManager.LoggedInUser.id;
            let board = new Board(player.id, player.name, isLocal);
            let cvElement = board.CreateCanvasElement();

            if (isLocal) {
                document.body.appendChild(cvElement);
            } else remoteBoards.append(cvElement);

            if (game.playerToPlayId === player.id) {
                cvElement.style.border = "8px solid green";
            }

            board.BoardData = player.board;
            playerBoards[board.OwnerId] = board;
        }
    });
}

function updateBoards() {
    getGame().then(game => {
        for (let player of game.players) {
            playerBoards[player.id].BoardData = player.board;
            console.log("Updated board for player " + player.id);
        }
    });
}

setInterval(updateBoards, 1000);

setInterval(() => {
    for (let [ownerId, board] of Object.entries(playerBoards)) {
        board.Paint();
    }
}, 50);
