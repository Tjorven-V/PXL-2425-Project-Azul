import APIEndpoints from "../../scripts/util/APIEndpoints.js";
import AuthenticationManager from "../../scripts/classes/AuthenticationManager.js";

let chatLog, chatInput, chatStatus;
let gameId, playerId;
let sendButton;
let lastMessageTime = 0;
const messageCooldown = 2000;

document.addEventListener('DOMContentLoaded', () => {
    chatLog = document.getElementById("chat-log");
    chatInput = document.getElementById("chat-input");
    chatStatus = document.getElementById("chat-status");
    sendButton = document.getElementById("send-button");

    document.getElementById('send-button')?.addEventListener('click', sendChat);

    let enterPress = (e) => {
        if (e.key !== "Enter") return;
        sendButton.click();
    };

    chatInput.addEventListener('keyup', enterPress);

    gameId = sessionStorage.getItem("gameId");
    const rawDataPlayer = sessionStorage.getItem("loggedInUser");

    try {
        if (rawDataPlayer) {
            const playerData = JSON.parse(rawDataPlayer);
            playerId = playerData.id;
        }
    } catch (e) {
        console.error("Failed to retrieve info:", e);
    }

    if (!gameId || !playerId) {
        console.error("Game ID or Player ID not found in sessionStorage");
        if (chatStatus) {
            chatStatus.textContent = "Error: Missing game or player information.";
        }
        return;
    }
    setInterval(loadChat, 1500);
});

async function loadChat() {
    try {
        const response = await fetch(APIEndpoints.GameInfo.replace("{id}", gameId), {
            headers: {
                'Authorization': `Bearer ${AuthenticationManager.Token}`
            }
        });
        if (!response.ok) throw new Error('Failed to load game');

        const game = await response.json();
        if (!game.chat) throw new Error("No chat data found");

        renderChat(game.chat);

    } catch (error) {
        renderChatError("Could not load chat");
        console.error(error);
    }
}

function renderChatError(chatMessages) {
    if (!chatLog) return;

    while (chatLog.firstChild) {
        chatLog.removeChild(chatLog.firstChild);
    }

    const errorMessage = document.createElement('p');
    errorMessage.className = 'error';
    errorMessage.appendChild(document.createTextNode(chatMessages));
    chatLog.appendChild(errorMessage);
}

function renderChat(chatMessages){
    if (!chatLog) return;

    while (chatLog.firstChild) {
        chatLog.removeChild(chatLog.firstChild);
    }

    chatMessages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'chat-message';

        const author = document.createTextNode(`${msg.author}: `);
        const message = document.createTextNode(msg.message);

        div.appendChild(author);
        div.appendChild(message);
        chatLog.appendChild(div);
    });

    chatLog.scrollTop = chatLog.scrollHeight;
}

window.sendChat = async function(){
    const now = Date.now()

    if (now - lastMessageTime < messageCooldown){
        chatStatus.textContent = "Please wait a moment before sending a new message";
        return;
    }

    const message = chatInput.value.trim();
    if (message.length <1 || message.length > 64) {
        chatStatus.textContent = 'Message must be between 1 and 64 characters';
        return;
    }

    const response = await fetch(APIEndpoints.SendChatMessage.replace("{id}", gameId),{
        method: 'POST',
        headers: {'Content-Type': 'application/json','Authorization': `Bearer ${AuthenticationManager.Token}`},
        body: JSON.stringify({playerId, message})
    });
    if (response.ok){
        chatInput.value=""
        chatStatus.textContent = "";
        lastMessageTime = now;
        await loadChat();
    } else {
        const errorText = await response.text();
        chatStatus.textContent = `Failed to send: ${errorText}`;
    }
}