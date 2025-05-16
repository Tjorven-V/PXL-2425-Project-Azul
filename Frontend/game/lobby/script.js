import APIEndpoints from '../../scripts/util/APIEndpoints.js';
import Redirects from '../../scripts/util/Redirects.js';
import AuthenticationManager from "../../scripts/classes/AuthenticationManager.js";

console.log('Lobby loaded');

const controlsDiv = document.getElementById('controls');
const joinBtn = document.getElementById('joinGame');
const leaveBtn = document.getElementById('leaveGame');
const statusEl = document.getElementById('status');
const playersEl = document.getElementById('players');

let tableId = null;
let interval = null;

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

function waitingTable(id, count, maxCount) {
    controlsDiv.style.display = 'none';
    leaveBtn.style.display = 'block';
    leaveBtn.disabled = false;
    statusEl.innerText = `Table ${id}: ${count}/${maxCount} players. Waiting...`;
}

joinBtn.addEventListener('click', async () => {
    console.log('playersEl.value:', playersEl.value);
    const count = parseInt(playersEl.value, 10);
    console.log('Parsed count:', count);

    if (!Number.isInteger(count) || count <= 0) {
        statusEl.innerText = 'Select number of players first';
        console.error('Invalid player count selected.');
        return;
    }
    if (!AuthenticationManager || !AuthenticationManager.Token) {
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

        console.log('JoinOrCreate server response status:', res.status);
        if (!res.ok) {
            const errorText = await res.text().catch(() => "Could not read error body");
            console.error('JoinOrCreate failed! Server response body:', errorText);
            throw new Error(`JoinOrCreate failed with status ${res.status}`);
        }

        const table = await res.json();

        tableId = table.id;
        waitingTable(tableId, table.seatedPlayers.length, table.preferences.numberOfPlayers);

        interval = setInterval(async () => {
            if (!tableId) {
                clearInterval(interval);
                interval = null;
                return;
            }
            try {
                const pollingUrl = APIEndpoints.GetTable.replace('{id}', tableId);
                console.log(`Polling table. ID: ${tableId}, URL: ${pollingUrl}`);

                const pollRes = await fetch(
                    pollingUrl,
                    { headers: { 'Authorization': `Bearer ${AuthenticationManager.Token}` } }
                );

                if (!pollRes.ok) {
                    clearInterval(interval);
                    interval = null;
                    console.error(`Error polling table ${tableId}: Status ${pollRes.status}`);
                    let errorMsg = 'Table not found or an error occurred while polling.';
                    try {
                        const errorData = await pollRes.json();
                        if (errorData && errorData.message) {
                            errorMsg = `Error: ${errorData.message}`;
                        }
                    } catch (e) { /*  */ }
                    statusEl.innerText = `${errorMsg} Returning to search...`;
                    setTimeout(() => searchTable(), 3000);
                    return;
                }

                const info = await pollRes.json();
                console.log(info);
                const currentCount = info.seatedPlayers.length;
                waitingTable(tableId, currentCount, info.preferences.numberOfPlayers);

                if (currentCount >= info.preferences.numberOfPlayers) {
                    clearInterval(interval);
                    interval = null;

                    leaveBtn.disabled = true;
                    leaveBtn.style.cursor = 'not-allowed';

                    let countdown = 3;
                    statusEl.innerText = `All players ready! Game starting in ${countdown}...`;

                    const countdownInterval = setInterval(async () => {
                        countdown--;
                        if (countdown > 0) {
                            statusEl.innerText = `All players ready! Game starting in ${countdown}...`;
                        } else {
                            clearInterval(countdownInterval);
                            statusEl.innerText = 'Starting game now!';

                            try {
                                let res_recheck = await fetch(APIEndpoints.GetTable.replace('{id}', tableId), {
                                    headers: { 'Authorization': `Bearer ${AuthenticationManager.Token}` }
                                });

                                // Re-enable leave button pas NADAT de check is gedaan en we weten wat te doen
                                // leaveBtn.disabled = false; // Doe dit pas als je teruggaat naar lobby
                                // leaveBtn.style.cursor = 'default';

                                if (!res_recheck.ok) {
                                    statusEl.innerText = 'Error starting game. Table no longer available.';
                                    leaveBtn.disabled = false;
                                    leaveBtn.style.cursor = 'default';
                                    searchTable();
                                    return;
                                }
                                let tableInfo = await res_recheck.json();

                                if (tableInfo.seatedPlayers && tableInfo.seatedPlayers.length >= tableInfo.preferences.numberOfPlayers && tableInfo.gameId) {
                                    sessionStorage.setItem("gameId", tableInfo.gameId);
                                    window.location.href = Redirects.Game + "?id=" + tableInfo.gameId;
                                } else {
                                    statusEl.innerText = 'A player left during countdown. Returning to lobby...';

                                    if (tableId && AuthenticationManager.Token) {
                                        console.log(`Player 1 actively leaving table ${tableId} as game start was cancelled after countdown.`);
                                        fetch(APIEndpoints.Leave.replace('{id}', tableId), {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${AuthenticationManager.Token}` }
                                        }).catch(err => console.error('Error for Player 1 trying to leave table automatically (after countdown):', err));
                                    }

                                    controlsDiv.style.display = 'block';
                                    leaveBtn.style.display = 'none';
                                    joinBtn.disabled = false;
                                    leaveBtn.disabled = false;
                                    leaveBtn.style.cursor = 'default';

                                    const lastSelectedCount = parseInt(playersEl.value, 10);
                                    if (Number.isInteger(lastSelectedCount) && lastSelectedCount > 0) {
                                        setTimeout(() => {
                                            console.log("Re-initiating join process by clicking joinGame button programmatically (after countdown failure).");
                                            joinBtn.click();
                                        }, 1000);
                                    } else {
                                        setTimeout(() => searchTable(), 3000);
                                    }
                                }
                            } catch (error) {
                                console.error('Error during final game start check (after countdown):', error);
                                statusEl.innerText = 'Error processing game start. Returning to lobby...';
                                leaveBtn.disabled = false;
                                leaveBtn.style.cursor = 'default';
                                searchTable();
                            }
                        }
                    }, 1000);
                }
            } catch (error) {
                clearInterval(interval);
                interval = null;
                console.error(`Network or other error polling table ${tableId}:`, error);
                statusEl.innerText = 'Connection error while polling. Returning to search...';
                setTimeout(() => searchTable(), 3000);
            }
        }, 2000);
    } catch (error) {
        console.error('Error during JoinOrCreate initial fetch or setup:', error);
        statusEl.innerText = 'Error searching for table.';
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
        if (!res.ok) throw new Error('Server error during leave');
        searchTable();
    } catch (error) {
        console.error('Error leaving table:', error);
        statusEl.innerText = 'Error leaving table.';
        leaveBtn.disabled = false;
    } finally {
        joinBtn.disabled = false;
    }
});

searchTable();