class Board {
    #_playerId;
    #_canvas;
    #_canvasContext;
    #_isLocal;

    constructor(playerId, isLocal) {
        this.#_playerId = playerId;
        this.#_isLocal = isLocal;
        // TODO: Check if this ID is ours. We need to save the logged in player in localStorage
    };

    CreateCanvasElement() {
        this.#_canvas = document.createElement("canvas");
        this.#_canvas.id = this.#_playerId;
        this.#_canvas.classList.add("board");

        let preferredWith = 600;
        let preferredHeight = 400;
        if (this.#_isLocal) {
            // preferredWith *= 1.25;
            // preferredHeight *= 1.25;
            this.#_canvas.classList.add("local-board");
        } else {
            this.#_canvas.classList.add("remote-board");
        }

        this.#_canvas.width = preferredWith;
        this.#_canvas.height = preferredHeight;

        this.#_canvasContext = this.#_canvas.getContext("2d");

        // document.body.appendChild(this.#_canvas);

        const image = new Image();
        image.crossOrigin = "anonymous"; // Needed if the image is hosted on a different origin

        image.onload = () => {
            this.#_canvasContext.drawImage(image, 0, 0, preferredWith, preferredHeight);
        };

        image.src = 'https://m.media-amazon.com/images/I/91omkrtpToL.jpg';
        //
        // document.body.appendChild(this.#_canvas);

        return this.#_canvas;
    }

    set BoardData(data) {

    }

    get IsLocal() {
        return this.#_isLocal;
    }

    get OwnerId() {
        return this.#_playerId;
    }

    get Canvas() {
        return this.#_canvas;
    }
}

export default Board;