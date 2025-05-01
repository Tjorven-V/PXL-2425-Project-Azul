using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

internal class FactoryDisplay : IFactoryDisplay
{
    private readonly List<TileType> _tiles = new List<TileType>();
    public FactoryDisplay(ITableCenter tableCenter)
    {
        //FYI: The table center is injected to be able to move tiles (that were not taken by a player) to the center

        _tiles = new List<TileType>();

    }

    public Guid Id { get; set; }

    public IReadOnlyList<TileType> Tiles => _tiles;

    public bool IsEmpty => _tiles.Count() == 0;

    public void AddTiles(IReadOnlyList<TileType> tilesToAdd)
    {
        throw new NotImplementedException();
    }

    public IReadOnlyList<TileType> TakeTiles(TileType tileType)
    {
        throw new NotImplementedException();
    }
}