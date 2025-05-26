import {Site as basePath} from "../util/BasePaths.js";

export let selectedSkin = "azul";

export function setSkin(newSkin, domBody) {
    selectedSkin = newSkin;
    domBody.style.background = `#883E0A url("../../media/skins/${newSkin}/table_background.png")  no-repeat center center`;
    domBody.style.backgroundSize = "cover";
    updateImagePaths(selectedSkin);
}

const TileImages = {
    0: new Image(),
    11: new Image(),
    12: new Image(),
    13: new Image(),
    14: new Image(),
    15: new Image()
}

const SoundEffects = {
    tilePlace: new Audio(),
    wrongMove: new Audio()
};

const BoardBackgroundImage = new Image();
const FactoryBackground = new Image();

function updateImagePaths(selectedSkin) {
    TileImages[0].src = basePath + `/media/skins/${selectedSkin}/tiles/0.png`;
    TileImages[11].src = basePath + `/media/skins/${selectedSkin}/tiles/11.png`;
    TileImages[12].src = basePath + `/media/skins/${selectedSkin}/tiles/12.png`;
    TileImages[13].src = basePath + `/media/skins/${selectedSkin}/tiles/13.png`;
    TileImages[14].src = basePath + `/media/skins/${selectedSkin}/tiles/14.png`;
    TileImages[15].src = basePath + `/media/skins/${selectedSkin}/tiles/15.png`;

    BoardBackgroundImage.src = basePath + `/media/skins/${selectedSkin}/board_background.png`;
    FactoryBackground.src = basePath + `/media/skins/${selectedSkin}/factory_background.png`;

    SoundEffects.tilePlace.src = basePath + `/media/skins/${selectedSkin}/sounds/tilePlace.mp3`;
    SoundEffects.wrongMove.src = basePath + `/media/skins/${selectedSkin}/sounds/wrong.mp3`;
}

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

    static get Sounds() {
        return SoundEffects;
    }
}

export default ResourceManager;
export { ResourceManager, updateImagePaths };