using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

internal class TableCenter : ITableCenter
{
    private readonly List<TileType> _tiles = new List<TileType>();

    //public Guid Id => throw new NotImplementedException();
    public Guid Id { get; } = Guid.NewGuid();

    //public IReadOnlyList<TileType> Tiles => throw new NotImplementedException();
    public IReadOnlyList<TileType> Tiles => _tiles.AsReadOnly();

    public bool IsEmpty => _tiles.Count() == 0;

    public void AddStartingTile()
    {
        //throw new NotImplementedException();
        _tiles.Add(TileType.StartingTile);
    }

    public void AddTiles(IReadOnlyList<TileType> tilesToAdd)
    {
        //throw new NotImplementedException();
        if (tilesToAdd == null) return;
        _tiles.AddRange(tilesToAdd);
    }

    public IReadOnlyList<TileType> TakeTiles(TileType tileType)
    {
        //throw new NotImplementedException();
        var takenTiles = _tiles.Where(t => t == tileType).ToList();
        _tiles.RemoveAll(t => t == tileType);
        return takenTiles.AsReadOnly();
    }
}