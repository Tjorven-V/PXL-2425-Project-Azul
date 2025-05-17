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

function updateStatus(message, makeVisible = true) {
    statusEl.innerText = message;
    if (makeVisible && message) {
        statusEl.style.display = 'block';
    } else if (!message) {
        statusEl.style.display = 'none';
    }
}

function searchTable() {
    controlsDiv.style.display = 'block';
    leaveBtn.style.display = 'none';
    joinBtn.disabled = false;
    updateStatus('', false);
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
    updateStatus(`Table ${id}: ${count}/${maxCount} players. Waiting...`);
}

joinBtn.addEventListener('click', async () => {
    console.log('playersEl.value:', playersEl.value);
    const count = parseInt(playersEl.value, 10);
    console.log('Parsed count:', count);

    if (!Number.isInteger(count) || count <= 0) {
        updateStatus('Select number of players first');
        console.error('Invalid player count selected.');
        return;
    }
    if (!AuthenticationManager || !AuthenticationManager.Token) {
        window.location.href = Redirects.Login;
        return;
    }

    updateStatus('Searching for table...');
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
            searchTable();
            updateStatus(`Error joining or creating table. Please try again.`);
            return;
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
                    } catch (e) { /* */ }
                    updateStatus(`${errorMsg} Returning to search...`);
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
                    updateStatus(`All players ready! Game starting in ${countdown}...`);

                    const countdownInterval = setInterval(async () => {
                        countdown--;
                        if (countdown > 0) {
                            updateStatus(`All players ready! Game starting in ${countdown}...`);
                        } else {
                            clearInterval(countdownInterval);
                            updateStatus('Starting game now!');

                            try {
                                let res_recheck = await fetch(APIEndpoints.GetTable.replace('{id}', tableId), {
                                    headers: { 'Authorization': `Bearer ${AuthenticationManager.Token}` }
                                });

                                if (!res_recheck.ok) {
                                    updateStatus('Error starting game. Table no longer available.');
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
                                    updateStatus('A player left during countdown. Returning to lobby...');

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
                                updateStatus('Error processing game start. Returning to lobby...');
                                leaveBtn.disabled = false;
                                leaveBtn.style.cursor = 'default';
                                setTimeout(() => searchTable(), 3000);
                            }
                        }
                    }, 1000);
                }
            } catch (error) {
                clearInterval(interval);
                interval = null;
                console.error(`Network or other error polling table ${tableId}:`, error);
                updateStatus('Connection error while polling. Returning to search...');
                setTimeout(() => searchTable(), 3000);
            }
        }, 2000);
    } catch (error) {
        console.error('Error during JoinOrCreate initial fetch or setup:', error);
        updateStatus('Error searching for table. Please try again.');

        joinBtn.disabled = false;
    }
});

leaveBtn.addEventListener('click', async () => {
    const token = AuthenticationManager.Token;
    if (!token) {
        window.location.href = Redirects.Login;
        return;
    }

    updateStatus('Leaving table...');
    leaveBtn.disabled = true;

    try {
        const res = await fetch(
            APIEndpoints.Leave.replace('{id}', tableId),
            { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (!res.ok) {
            updateStatus('Server error during leave. Please try again.');
            throw new Error('Server error during leave');
        }
        searchTable();
    } catch (error) {
        console.error('Error leaving table:', error);
        updateStatus('Error leaving table. Please try again.');
        leaveBtn.disabled = false;
    } finally {
        // joinBtn.disabled = false;
    }
});

searchTable();

function updateFooter() {
    const currentYearEl = document.getElementById('currentYear');
    if (currentYearEl) {
        currentYearEl.innerText = new Date().getFullYear();
    }

    const currentDateEl = document.getElementById('currentDate');
    if (currentDateEl) {
        currentDateEl.innerText = new Date().toLocaleDateString(undefined, {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
}

updateFooter();