let basePath;
if (window.location.hostname === 'localhost') {
    basePath = window.location.origin + "/Frontend";
} else {
    basePath = window.location.hostname;
}

const TileImages = {
    0: new Image(),
    11: new Image(),
    12: new Image(),
    13: new Image(),
    14: new Image(),
    15: new Image()
}

TileImages[0].src = basePath + "/media/azul/tiles/0.png"
TileImages[11].src = basePath + "/media/azul/tiles/11.png"
TileImages[12].src = basePath + "/media/azul/tiles/12.png"
TileImages[13].src = basePath + "/media/azul/tiles/13.png"
TileImages[14].src = basePath + "/media/azul/tiles/14.png"
TileImages[15].src = basePath + "/media/azul/tiles/15.png"

const BoardBackgroundImage = new Image();
BoardBackgroundImage.src = basePath + "/media/azul/board_background.png";

const FactoryBackground = new Image();
FactoryBackground.src = basePath + "/media/azul/factory_background.png";

class ResourceManager {
    static #_resources = [
        ...Object.values(TileImages),
        BoardBackgroundImage,
        FactoryBackground
    ]

    static get AllLoaded () {
        return this.#_resources.every(img => img.complete);
    }

    static get Tiles() {
        return TileImages;
    }

    static get BoardBackground() {
        return BoardBackgroundImage;
    }

    static get FactoryBackground() {
        return FactoryBackground;
    }
}

export default ResourceManager;