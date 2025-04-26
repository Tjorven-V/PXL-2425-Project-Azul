const baseUrl = "http://localhost:5050/api";

const APIEndpoints = {
    // Authentication
    Register: baseUrl + "/Authentication/register",
    Authentication: baseUrl + "/Authentication/token",

    // Games
    GameInfo: baseUrl + "/Games/{id}",
    TakeTiles: baseUrl + "/Games/{id}/take-tiles",
    PlaceTilesPatternLine: baseUrl + "/Games/{id}/place-tiles-on-patternline",
    PlaceTilesFloor: baseUrl + "/Games/{id}/place-tiles-on-floorline",

    // Home
    Ping: baseUrl + "/ping",

    // Tables
    GetTable: baseUrl + "/Tables/{id}",
    JoinOrCreate: baseUrl + "/join-or-create",
    Leave: baseUrl + "/leave",
}

export default APIEndpoints;