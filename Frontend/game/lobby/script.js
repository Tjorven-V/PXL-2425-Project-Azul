import APIEndpoints from '../../scripts/util/APIEndpoints.js';
import Redirects from '../../scripts/util/Redirects.js';
import AuthenticationManager from "../../scripts/classes/AuthenticationManager.js";

console.log('Lobby loaded');
//console.log('Token in localStorage:', localStorage.getItem('token'));
//console.log('Token in sessionStorage:', sessionStorage.getItem('token'));

// zorg dat elke tab een eigen sessionStorage-token krijgt (kopie van localStorage bij eerste keer)
// if (!sessionStorage.getItem('token') && localStorage.getItem('token')) {
//     sessionStorage.setItem('token', localStorage.getItem('token'));
// }

const controlsDiv = document.getElementById('controls');
const joinBtn = document.getElementById('joinGame');
const leaveBtn = document.getElementById('leaveGame');
const statusEl = document.getElementById('status');
const playersEl = document.getElementById('players');

let tableId = null;
let interval = null;

// reset to search
function searchTable() {
    controlsDiv.style.display = 'block';
    leaveBtn.style.display = 'none';
    joinBtn.disabled = false;
    statusEl.innerText = '';
    tableId = null;
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
}

// show waiting state
function waitingTable(id, count, maxCount) {
    controlsDiv.style.display = 'none';
    leaveBtn.style.display = 'block';
    leaveBtn.disabled = false;
    statusEl.innerText = `Table ${id}: ${count}/${maxCount} players. Waiting...`;
}

joinBtn.addEventListener('click', async () => {
    const count = parseInt(playersEl.value, 10);
    if (!Number.isInteger(count) || count <= 0) {
        statusEl.innerText = 'Select number of players first';
        return;
    }
    if (!AuthenticationManager) {
        window.location.href = Redirects.Login;
        return;
    }

    statusEl.innerText = 'Searching for table...';
    joinBtn.disabled = true;

    try {
        const res = await fetch(APIEndpoints.JoinOrCreate, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AuthenticationManager.Token}`
            },
            body: JSON.stringify({ numberOfPlayers: count })
        });
        if (!res.ok) throw new Error();
        const table = await res.json();

        tableId = table.id;
        const gameId = table.gameId;
        waitingTable(tableId, table.seatedPlayers.length, table.preferences.numberOfPlayers);

        interval = setInterval(async () => {
            if (!tableId) {
                clearInterval(interval);
                interval = null;
                return;
            }
            try {
                const pollRes = await fetch(
                    APIEndpoints.GetTable.replace('{id}', tableId),
                    { headers: { 'Authorization': `Bearer ${AuthenticationManager.Token}` } }
                );
                if (!pollRes.ok) {
                    clearInterval(interval);
                    return;
                }
                const info = await pollRes.json();
                const currentCount = info.seatedPlayers.length;
                waitingTable(tableId, currentCount, info.preferences.numberOfPlayers);
                if (currentCount >= info.preferences.numberOfPlayers) {
                    clearInterval(interval);
                    statusEl.innerText = 'All players ready! Game starting...';
                    leaveBtn.style.display = 'none';

                    // Redirect to game (game.html)
                    setTimeout(async () => {

                        let res = await fetch(APIEndpoints.GetTable.replace('{id}', tableId),
                            { headers: { 'Authorization': `Bearer ${AuthenticationManager.Token}` } }
                        );
                        let j = await res.json();
                        sessionStorage.setItem("gameId", j.gameId);
                        window.location.href = Redirects.Game + "?id=" + j.gameId;
                    }, 1000);
                }
            } catch {
                clearInterval(interval);
            }
        }, 2000); // polling every 2 seconds
    } catch {
        statusEl.innerText = 'Error searching';
        searchTable();
    }
});

leaveBtn.addEventListener('click', async () => {
    const token = AuthenticationManager.Token;
    if (!token) {
        window.location.href = Redirects.Login;
        return;
    }

    statusEl.innerText = 'Leaving table...';
    leaveBtn.disabled = true;

    try {
        const res = await fetch(
            APIEndpoints.Leave.replace('{id}', tableId),
            { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error();
        searchTable();
    } catch {
        statusEl.innerText = 'Error leaving';
        leaveBtn.disabled = false;
    } finally {
        joinBtn.disabled = false;
    }
});

searchTable();
