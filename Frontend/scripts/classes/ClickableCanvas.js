class ClickableCanvas {
    #_clickableSpots;
    #_canvas;
    #_canvasContext;

    constructor(id, width, height, classes) {
        this.#_clickableSpots = {};

        this.#_canvas = document.createElement("canvas");
        this.#_canvas.id = id;
        this.#_canvas.classList.add(...classes);
        this.#_canvas.addEventListener("click", e => this.#Click(e));

        // reference resolution of 100×100
        // do not change, scale with CSS instead.
        this.#_canvas.width = width;
        this.#_canvas.height = height;

        this.#_canvasContext = this.#_canvas.getContext("2d");
    }

    RegisterClickableRegion(name, x, y, w, h, callback) {
        this.#_clickableSpots[name] = {x, y, w, h, click: callback}
    }

    ClearClickableRegions() {
        this.#_clickableSpots = {};
    }

    get Canvas() {
        return this.#_canvas;
    }

    get CanvasContext() {
        return this.#_canvasContext;
    }

    #Click(event) {
        const rect = event.target.getBoundingClientRect();
        const scaleX = event.target.width / rect.width;
        const scaleY = event.target.height / rect.height;

        const relativeX = (event.clientX - rect.left) * scaleX;
        const relativeY = (event.clientY - rect.top) * scaleY;

        for (let [_, clickRegion] of Object.entries(this.#_clickableSpots)) {
            const isXInside = relativeX >= clickRegion.x && relativeX <= clickRegion.x + clickRegion.w;
            const isYInside = relativeY >= clickRegion.y && relativeY <= clickRegion.y + clickRegion.h;

            if (isXInside && isYInside && typeof clickRegion.click === "function") {
                clickRegion.click();
            }
        }
    }
}

export default ClickableCanvas;