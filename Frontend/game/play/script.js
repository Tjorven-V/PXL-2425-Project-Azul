import APIEndpoints from '../../scripts/util/APIEndpoints.js';
import Redirects from '../../scripts/util/Redirects.js';

const canvas = document.getElementById('Canvas');
const ctx = canvas.getContext('2d');


async function getGame(){
    let gameId;
    if (sessionStorage.getItem('gameId')) {
        gameId = sessionStorage.getItem('gameId');
    }
    if(gameId == null){
        throw new Error('No gameId found.');
    }
    let response = await fetch(APIEndpoints.GameInfo.replace("{id}", gameId))
    return response.json();
}


