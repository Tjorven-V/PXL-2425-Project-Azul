using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

/// <inheritdoc cref="ITileBag"/>
internal class TileBag : ITileBag
{
    public IReadOnlyList<TileType> Tiles => throw new NotImplementedException();

    public void AddTiles(int amount, TileType tileType)
    {
        throw new NotImplementedException();
    }

    public void AddTiles(IReadOnlyList<TileType> tilesToAdd)
    {
        throw new NotImplementedException();
    }

    public bool TryTakeTiles(int amount, out IReadOnlyList<TileType> tiles)
    {
        throw new NotImplementedException();
    }
}