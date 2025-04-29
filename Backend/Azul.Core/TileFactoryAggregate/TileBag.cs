using System;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

/// <inheritdoc cref="ITileBag"/>
internal class TileBag : ITileBag
{
    private readonly List<TileType> _tiles = new List<TileType>();
    public IReadOnlyList<TileType> Tiles => _tiles;
    private readonly Random _random = new Random();

    public void AddTiles(int amount, TileType tileType)
    {
        for (int i = 0; i < amount; i++)
        {
            _tiles.Add(tileType);
        }
    }

    public void AddTiles(IReadOnlyList<TileType> tilesToAdd)
    {
        _tiles.AddRange(tilesToAdd);
    }

    public bool TryTakeTiles(int amount, out IReadOnlyList<TileType> tiles)
    {
        if (amount <= 0)
        {
            tiles = new List<TileType>();
            return false;
        }

        if (amount > _tiles.Count)
        {
            var allTiles = _tiles.ToList();
            _tiles.Clear();
            tiles = allTiles;
            return false;
        }

        var shuffledTiles = _tiles.OrderBy(x => _random.Next()).ToList();
        var takenTiles = shuffledTiles.Take(amount).ToList();

        foreach (var tile in takenTiles)
        {
            _tiles.Remove(tile);
        }

        tiles = takenTiles;
        return true;
    }
}