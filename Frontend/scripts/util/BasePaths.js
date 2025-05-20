let siteBasePath, apiBasePath;

const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "";

if (window.location.protocol === "file:") {
    alert("Locally opening files is not supported.");
} else if (isLocalhost) {
    siteBasePath = window.origin + "/Frontend";
    apiBasePath = "https://localhost:5051";
} else {
    siteBasePath = window.origin + "/azul";
    apiBasePath = "https://node-strawberry.nasldc.com:5051";
}

console.log(`Determined paths:\nAPI: ${apiBasePath}\nSite: ${siteBasePath}`);

export {
    apiBasePath as API,
    siteBasePath as Site,
}