import APIEndpoints from '../../scripts/util/APIEndpoints.js';
import Redirects from '../../scripts/util/Redirects.js';
import AuthenticationManager from "../../scripts/classes/AuthenticationManager.js";

function RedirectToLogin() {
    window.location = Redirects.Login;
}

let joinBtnElement, leaveBtnElement, playerCountSelectElement, controlsElement, statusElement;
document.addEventListener('DOMContentLoaded', async (event) => {
    if (!AuthenticationManager.LoggedInUser) {
        RedirectToLogin();
        return;
    }

    joinBtnElement = document.getElementById('joinGame');
    leaveBtnElement = document.getElementById('leaveGame');
    playerCountSelectElement = document.getElementById('players');
    controlsElement = document.getElementById('controls');
    statusElement = document.getElementById('status');

    SetControlsStatus(false);
    SetStatusText("Determining Player Table...");

    let currentTable;
    try {
        currentTable = await GetCurrentTable();
    } catch (err) {
        SetStatusText("An error occurred trying to determine your current table:\n" + err.message + "\n\nThis most likely means our API is currently unavailable. Sorry!");
        return;
    }


    if (currentTable !== null && currentTable.error) { // user likely not authenticated
        SetStatusText("An error occurred determining if you are at a table or not. As this is likely an authentication error, you will be redirected to the login page. If this persists, please report it.");

        setTimeout(() => {
            RedirectToLogin();
        }, 7_500);
        return;
    }

    if (currentTable) { // user at a table
        ShowLobby(currentTable.id);
    } else if (!currentTable) { // user not at a table
        ShowControls();
    }

    joinBtnElement.addEventListener('click', function () {
        let numberOfPlayers = parseInt(playerCountSelectElement.value);
        JoinOrCreate(numberOfPlayers);
    })
    leaveBtnElement.addEventListener('click', LeaveTable);

    SetControlsStatus(true);
})

function SetControlsStatus(enabled, cursor = "blocked") {
    joinBtnElement.disabled = !enabled;
    leaveBtnElement.disabled = !enabled;
    playerCountSelectElement.disabled = !enabled;

    if (!enabled) {
        joinBtnElement.style.cursor = cursor;
        leaveBtnElement.style.cursor = cursor;
        playerCountSelectElement.style.cursor = cursor;
    } else {
        joinBtnElement.style.cursor = "";
        leaveBtnElement.style.cursor = "";
        playerCountSelectElement.style.cursor = "";
    }
}

function SetStatusText(text) {
    statusElement.replaceChildren();

    let lines = text.split('\n');
    if (lines.length > 1) {
        for (let line of lines) {
            statusElement.appendChild(document.createTextNode(line));
            statusElement.appendChild(document.createElement("br"));
        }
    } else {
        statusElement.appendChild(document.createTextNode(text));
    }

    if (text === "") {
        statusElement.style.display = "none";
    } else {
        statusElement.style.display = "block";
    }
}

async function GetCurrentTable() {
    let response = await fetch(APIEndpoints.CurrentTable, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AuthenticationManager.Token}`
        }
    })

    if (response.status === 200) {
        return await response.json();
    } else if (response.status === 204) {
        return null;
    } else {
        alert("DEV ERROR!!! This is critical, check console.");
        console.error(response);
        return {
            error: true,
            ...response
        }
    }
}

async function LeaveTable() {
    let table = await GetCurrentTable();

    fetch(APIEndpoints.Leave.replace('{id}', table.id), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AuthenticationManager.Token}`
        }
    }).then(response => {
        StopPollingTable();
        ShowControls();
        SetControlsStatus(true);
    }).catch(err => {
        alert("DEV ERROR! Not critical but one unaccounted for...");
        console.error(err);
    });
}

function JoinOrCreate(numberOfPlayers) {
    SetStatusText("Searching for a game with " + numberOfPlayers + " player(s)...");
    SetControlsStatus(false, "wait");

    fetch(APIEndpoints.JoinOrCreate, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AuthenticationManager.Token}`
        },
        body: JSON.stringify({ numberOfPlayers })
    }).then(async response => {
        SetControlsStatus(true);
        if (!response.ok) {
            SetStatusText(`An error occurred while looking for a game!\n\n${response.status} ${response.statusText}\n${response.message}`);
            return;
        }

        let data = await response.json();
        ShowLobby(data.id);

    }).catch(err => {
        alert("DEV ERROR!!! Check console");
        console.error(err);
    })
}

function ShowControls() {
    controlsElement.style.display = 'block';
    leaveBtnElement.style.display = 'none';
    SetStatusText("");
}

let tablePoll;
function PollTable(tableId, callback) {
    if (tablePoll) {
        clearInterval(tablePoll);
        tablePoll = null;
    }

    tablePoll = setInterval(() => {
        fetch(APIEndpoints.GetTable.replace('{id}', tableId), {
                headers: {
                    'Authorization': `Bearer ${AuthenticationManager.Token}`
                }
            }
        ).then(async response => {
            if (!response.ok) {
                SetStatusText(`An error occurred polling table\n${tableId}!\n\n${response.status} ${response.statusText}\n${response.message}`);
                return;
            }

            callback(await response.json());
        }).catch(err => {
            clearInterval(tablePoll);
            tablePoll = null;

            alert("DEV ERROR!!! Check console");
            console.error(err);
        })
    }, 500);
}

function StopPollingTable() {
    clearInterval(tablePoll);
    tablePoll = null;
}

function ShowLobby(tableId) {
    controlsElement.style.display = 'none';
    statusElement.style.display = 'block';
    leaveBtnElement.style.display = 'block';

    SetStatusText("Table " + tableId + "\n\nRetrieving info...");
    PollTable(tableId, (tableData) => {
        let text = `Seated Players (${tableData.seatedPlayers.length}/${tableData.preferences.numberOfPlayers})\n`
        for (let player of tableData.seatedPlayers) {
            text += player.name + "\n";
        }

        text += "\n";
        if (tableData.hasAvailableSeat) {
            text += "Waiting for players...";
        } else {
            SetControlsStatus(false, "blocked");
            StopPollingTable();
            text += "Game Starting!\nYou will be redirected shortly...";

            setTimeout(() => {
                RedirectToGame(tableData.gameId);
            }, 3_000);
        }

        SetStatusText("Table " + tableId + "\n\n" + text);
    });
}

function RedirectToGame(gameId) {
    sessionStorage.setItem("gameId", gameId);
    window.location.href = Redirects.Game + "?id=" + gameId;
}