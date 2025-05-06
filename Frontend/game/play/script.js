import APIEndpoints from '../../scripts/util/APIEndpoints.js';
import Board from "../../scripts/classes/Board.js";
import FactoryDisplay from "../../scripts/classes/FactoryDisplay.js";
import AuthenticationManager from "../../scripts/classes/AuthenticationManager.js";
import ResourceManager from "../../scripts/classes/ResourceManager.js";
import factoryDisplay from "../../scripts/classes/FactoryDisplay.js";

document.addEventListener("DOMContentLoaded", function() {

    let subtitle = document.querySelector("#loading-resources .subtitle");
    subtitle.replaceChildren(...[
        document.createTextNode("Game " + sessionStorage.getItem("gameId")),
        document.createElement("br"), document.createElement("br"),
        document.createTextNode("Playing as " + AuthenticationManager.LoggedInUser.userName),
    ]);

    const c = setInterval(() => {
        if (ResourceManager.AllLoaded) {

            document.getElementById("loading-resources").style.display = "none";

            let gameInfo = document.getElementById("game-information");
            gameInfo.replaceChildren(...[
                document.createTextNode("Game " + sessionStorage.getItem("gameId")),
                document.createElement("br"), document.createElement("br"),
                document.createTextNode("Playing as " + AuthenticationManager.LoggedInUser.userName),
                document.createElement("br"),
                document.createTextNode(AuthenticationManager.LoggedInUser.id),
            ]);

            gameInfo.style.position = "fixed";
            gameInfo.style.display = "block";

            clearInterval(c);
            loadBoards();
        }
    }, 1000);

    setInterval(updateBoards, 1000);

    setInterval(() => {
        for (let [id, board] of Object.entries(playerBoards)) {
            board.Paint();
        }
        for (let [id, factory] of Object.entries(factoryDisplay)) {
            factory.Paint();
        }
    }, 50);
})

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
let factoryDisplays = {};
function loadBoards() {
    getGame().then(game => {
        let remoteBoards = document.getElementById("remote-boards-container");
        let factoryDisplaysContainer = document.getElementById("factory-displays-container");

        for (let factoryDisplay of game.tileFactory.displays) {
            let factory = new FactoryDisplay(factoryDisplay.id);
            factory.Tiles = factoryDisplay.tiles;

            factoryDisplaysContainer.append(factory.Canvas);

            factory.Paint();
            factoryDisplays[factory.Id] = factory;
        }

        for (let player of game.players) {
            let isLocal = player.id === AuthenticationManager.LoggedInUser.id;
            let board = new Board(player.id, player.name, isLocal);

            if (isLocal) {
                document.body.appendChild(board.Canvas);
            } else remoteBoards.append(board.Canvas);

            if (game.playerToPlayId === player.id) {
                board.Canvas.style.border = "2px solid green";
            }

            board.BoardData = player.board;
            playerBoards[board.OwnerId] = board;
        }
    });
}

function updateBoards() {
    getGame().then(game => {
        for (let player of game.players) {
            let board = playerBoards[player.id];
            board.BoardData = player.board;
            board.AtTurn = game.playerToPlayId === player.id;
        }

        for (let factoryDisplay of game.tileFactory.displays) {
            let factory = factoryDisplays[factoryDisplay.id];
            factory.Tiles = factory.tiles;
        }
    });
}
