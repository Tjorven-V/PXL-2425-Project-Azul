const baseUrl = "https://localhost:5051/";

const APIEndpoints = {
    // Authentication
    Register: baseUrl + "api/Authentication/register",
    Authentication: baseUrl + "api/Authentication/token",

    // Games
    GameInfo: baseUrl + "api/Games/{id}",
    TakeTiles: baseUrl + "api/Games/{id}/take-tiles",
    PlaceTilesPatternLine: baseUrl + "api/Games/{id}/place-tiles-on-patternline",
    PlaceTilesFloorLine: baseUrl + "api/Games/{id}/place-tiles-on-floorline",
    SendChatMessage: baseUrl + "api/Games/{id}/send-chat-message", // Azul 51 Extra: Chat Functionality

    // Home
    Ping: baseUrl + "ping",

    // Tables
    GetTable: baseUrl + "api/Tables/{id}",
    JoinOrCreate: baseUrl + "api/Tables/join-or-create",
    Leave: baseUrl + "api/Tables/{id}/leave",

    AllTables: baseUrl + "api/Tables", // Azul 51 Extra: Table Browser
    JoinTable: baseUrl + "api/Tables/{id}/join", // Azul 51 Extra: Table Browser
    CurrentTable: baseUrl + "api/Tables/get-current-table", // Azul 51 Extra: Table Browser
}

export default APIEndpoints;