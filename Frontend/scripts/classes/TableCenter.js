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

        const tilesPerRow = 10;
        const padding = 10;
        const desiredBorderWidth = 4;

        const effectiveCanvasWidth = this.Canvas.width - desiredBorderWidth;

        const maxTileSize = (effectiveCanvasWidth - (tilesPerRow - 1) * padding) / tilesPerRow;

        const contentBlockWidth = tilesPerRow * maxTileSize + (tilesPerRow - 1) * padding;

        let transX = desiredBorderWidth / 2;
        transX += (effectiveCanvasWidth - contentBlockWidth) / 2;

        const transY = 20;
        const actualTransY = transY;

        ctx.save();
        ctx.translate(transX, actualTransY);

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
                actualTransY + y,
                maxTileSize,
                maxTileSize,
                () => this.handleTileClick(tileType)
            );

            if (ResourceManager.Tiles[tileType]) {
                ctx.drawImage(
                    ResourceManager.Tiles[tileType],
                    x, y, maxTileSize, maxTileSize
                );
            }
        });

        if (gameState.currentSelection?.displayId === this.id) {
            const selectedType = gameState.currentSelection.tileType;

            const originalLineWidth = ctx.lineWidth;
            const originalStrokeStyle = ctx.strokeStyle;
            ctx.lineWidth = desiredBorderWidth;
            ctx.strokeStyle = 'yellow';

            filteredTiles.forEach(({ tileType, originalIndex }, filteredIndex) => {
                if (tileType === selectedType) {
                    const row = Math.floor(filteredIndex / tilesPerRow);
                    const col = filteredIndex % tilesPerRow;
                    const x = col * (maxTileSize + padding);
                    const y = row * (maxTileSize + padding);

                    this.drawTileHighlight(ctx, x, y, maxTileSize, maxTileSize);
                }
            });

            ctx.lineWidth = originalLineWidth;
            ctx.strokeStyle = originalStrokeStyle;
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
