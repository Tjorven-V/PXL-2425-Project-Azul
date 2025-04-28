using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.BoardAggregate;

/// <inheritdoc cref="IPatternLine"/>
internal class PatternLine : IPatternLine
{
    public PatternLine(int length)
    {
    }

    public int Length => throw new NotImplementedException();

    public TileType? TileType => throw new NotImplementedException();

    public int NumberOfTiles => throw new NotImplementedException();

    public bool IsComplete => throw new NotImplementedException();

    public void Clear()
    {
        throw new NotImplementedException();
    }

    public void TryAddTiles(TileType type, int numberOfTilesToAdd, out int remainingNumberOfTiles)
    {
        throw new NotImplementedException();
    }
}