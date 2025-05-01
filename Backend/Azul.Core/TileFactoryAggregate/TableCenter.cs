using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

internal class TableCenter : ITableCenter
{
    private readonly List<TileType> _tiles = new List<TileType>();

    public Guid Id => throw new NotImplementedException();

    public IReadOnlyList<TileType> Tiles => throw new NotImplementedException();

    public bool IsEmpty => _tiles.Count() == 0;

    public void AddStartingTile()
    {
        throw new NotImplementedException();
    }

    public void AddTiles(IReadOnlyList<TileType> tilesToAdd)
    {
        throw new NotImplementedException();
    }

    public IReadOnlyList<TileType> TakeTiles(TileType tileType)
    {
        throw new NotImplementedException();
    }
}