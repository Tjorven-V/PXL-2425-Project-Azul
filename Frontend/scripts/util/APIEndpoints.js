const baseUrl = "https://localhost:5051/api";

const APIEndpoints = {
    // Authentication
    Register: baseUrl + "/Authentication/register",
    Authentication: baseUrl + "/Authentication/token",

    // Games
    GameInfo: baseUrl + "/Games/{id}",
    TakeTiles: baseUrl + "/Games/{id}/take-tiles",
    PlaceTilesPatternLine: baseUrl + "/Games/{id}/place-tiles-on-patternline",
    PlaceTilesFloorLine: baseUrl + "/Games/{id}/place-tiles-on-floorline",
    SendChatMessage: baseUrl + "/Games/{id}/send-chat-message", // Azul 51 Extra: Chat Functionality

    // Home
    Ping: baseUrl + "/ping",

    // Tables
    GetTable: baseUrl + "/Tables/{id}",
    JoinOrCreate: baseUrl + "/Tables/join-or-create",
    Leave: baseUrl + "/Tables/{id}/leave",

    AllTables: baseUrl + "/Tables", // Azul 51 Extra: Table Browser
    JoinTable: baseUrl + "/Tables/{id}/join", // Azul 51 Extra: Table Browser
    CurrentTable: baseUrl + "/Tables/get-current-table", // Azul 51 Extra: Table Browser
}

export default APIEndpoints;