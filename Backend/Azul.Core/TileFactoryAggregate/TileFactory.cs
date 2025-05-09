using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

internal class TileFactory : ITileFactory
{
    private readonly List<IFactoryDisplay> _displays = new List<IFactoryDisplay>();
    public ITableCenter TableCenter { get; private set; }
    internal TileFactory(int numberOfDisplays, ITileBag bag)
    {
        Bag = bag;
        TableCenter = new TableCenter();

        for (int i = 0; i < numberOfDisplays; i++)
        {
            _displays.Add(new FactoryDisplay(TableCenter));
        }

        UsedTiles = new List<TileType>();
    }

    public ITileBag Bag { get; private set; }

    public IReadOnlyList<IFactoryDisplay> Displays => _displays;

    private List<TileType> _usedTiles;

    public IReadOnlyList<TileType> UsedTiles
    {
        get => _usedTiles;
        private set => _usedTiles = value.ToList();
    }

    public bool IsEmpty => _displays.All(d => d.IsEmpty);

    public void AddToUsedTiles(TileType tile)
    {
        _usedTiles.Add(tile);
    }

    public void FillDisplays()
    {
        foreach (var display in Displays)
        {
            List<TileType> tilesForDisplay = new List<TileType>();

            if (Bag.TryTakeTiles(4, out var takenTiles))
            {
                tilesForDisplay.AddRange(takenTiles);
                display.AddTiles(tilesForDisplay);
                continue;
            }

            tilesForDisplay.AddRange(takenTiles);

            int remaining = 4 - takenTiles.Count;

            Bag.AddTiles(_usedTiles); 
            _usedTiles.Clear(); 

            if (!Bag.TryTakeTiles(remaining, out var remainingTiles))
            {
                throw new InvalidOperationException("Not enough tiles in the bag to fill the displays.");
            }

            tilesForDisplay.AddRange(remainingTiles);
            display.AddTiles(tilesForDisplay);
        }
    }

    public IReadOnlyList<TileType> TakeTiles(Guid displayId, TileType tileType)
    {
        var display = Displays.FirstOrDefault(d => d.Id == displayId);
        if (display == null || display is not FactoryDisplay factoryDisplay)
        {
            throw new InvalidOperationException("Display does not exist.");
        }

        if (!display.Tiles.Contains(tileType))
        {
            throw new InvalidOperationException($"Tile type not found in display.");
        }

        var takenTiles = factoryDisplay.TakeTiles(tileType);
        TableCenter.AddTiles(factoryDisplay.Tiles.ToList());
        factoryDisplay.SetTiles(new List<TileType>());

        return takenTiles;
    }
}
