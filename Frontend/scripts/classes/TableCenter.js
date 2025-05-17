import ResourceManager from "./ResourceManager.js";
import ClickableCanvas from "./ClickableCanvas.js";
import { gameState } from "../../game/play/script.js";

class TableCenter extends ClickableCanvas {
    constructor(id) {
        super("table-center", 600, 200, ["table-center-display"]);
        this.id = id;
        this.tiles = [];
    }

    Clear() {
        this.CanvasContext.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
        this.ClearClickableRegions();
    }

    set Tiles(newTiles) {
        this.tiles = newTiles;
        this.Paint();
    }

    Paint() {
        this.Clear();
        const ctx = this.CanvasContext;

        const tilesPerRow = 8;
        const padding = 10;
        const maxTileSize = (this.Canvas.width - (tilesPerRow - 1) * padding) / tilesPerRow;

        const transX = (this.Canvas.width - (tilesPerRow * maxTileSize + (tilesPerRow - 1) * padding)) / 2;
        const transY = 20;

        ctx.save();
        ctx.translate(transX, transY);

        const filteredTiles = this.tiles
            .map((tileType, originalIndex) => ({ tileType, originalIndex }))
            .filter(({ tileType }) => tileType !== 0);

        filteredTiles.forEach(({ tileType, originalIndex }, filteredIndex) => {
            const row = Math.floor(filteredIndex / tilesPerRow);
            const col = filteredIndex % tilesPerRow;

            const x = col * (maxTileSize + padding);
            const y = row * (maxTileSize + padding);

            this.RegisterClickableRegion(
                `tile_${originalIndex}`,
                transX + x,
                transY + y,
                maxTileSize,
                maxTileSize,
                () => this.handleTileClick(tileType)
            );

            if (ResourceManager.Tiles[tileType]) {
                ctx.drawImage(
                    ResourceManager.Tiles[tileType],
                    x,
                    y,
                    maxTileSize,
                    maxTileSize
                );
            }
        });

        if (gameState.currentSelection?.displayId === this.id) {
            const selectedType = gameState.currentSelection.tileType;

            filteredTiles.forEach(({ tileType, originalIndex }, filteredIndex) => {
                if (tileType === selectedType) {
                    const row = Math.floor(filteredIndex / tilesPerRow);
                    const col = filteredIndex % tilesPerRow;
                    const x = col * (maxTileSize + padding);
                    const y = row * (maxTileSize + padding);

                    this.drawTileHighlight(ctx, x, y, maxTileSize, maxTileSize);
                }
            });
        }

        ctx.restore();
    }

    handleTileClick(tileType) {
        document.dispatchEvent(new CustomEvent('factoryTileSelected', {
            detail: {
                displayId: this.id,
                tileType: tileType,
                tileCount: this.tiles.filter(t => t === tileType).length
            }
        }));
    }
}

export default TableCenter;