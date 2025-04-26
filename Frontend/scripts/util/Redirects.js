let basePath;
if (window.location.hostname === 'localhost') {
    basePath = window.location.origin + "/Frontend";
} else {
    basePath = window.location.hostname;
}

export default {
    Registration: basePath + "/user/register",
    Login: basePath + "/user/login",
    OwnProfile: basePath + "/user/me",
    Lobby: basePath + "/game/lobby",
}