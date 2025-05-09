using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

internal class FactoryDisplay : IFactoryDisplay
{
    private readonly List<TileType> _tiles = new List<TileType>();
    public FactoryDisplay(ITableCenter tableCenter)
    {
        //FYI: The table center is injected to be able to move tiles (that were not taken by a player) to the center

        _tiles = new List<TileType>();
        Id = Guid.NewGuid();
    }

    public Guid Id { get; set; }

    public IReadOnlyList<TileType> Tiles => _tiles;

    public bool IsEmpty => _tiles.Count() == 0;

    public void AddTiles(IReadOnlyList<TileType> tilesToAdd)
    {
        if (tilesToAdd == null || tilesToAdd.Count == 0)
        {
            return;
        }
        _tiles.AddRange(tilesToAdd);
    }

    public IReadOnlyList<TileType> TakeTiles(TileType tileType)
    {
        var takenTiles = _tiles.Where(t => t == tileType).ToList();

        foreach (var tile in takenTiles)
        {
            _tiles.Remove(tile);
        }

        return takenTiles.AsReadOnly();
    }

    public void SetTiles(List<TileType> newTiles)
    {
        _tiles.Clear();
        _tiles.AddRange(newTiles);
    }

}