using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.BoardAggregate;

/// <inheritdoc cref="IPatternLine"/>
internal class PatternLine : IPatternLine
{
    public PatternLine(int length)
    {
        Length = length;
    }

    public int Length { get; set; }

    public TileType? TileType {  get; private set; }

    public int NumberOfTiles { get; private set; }

    public bool IsComplete => NumberOfTiles == Length;

    public void Clear()
    {
        TileType = null;
        NumberOfTiles = 0;
    }

    public void TryAddTiles(TileType type, int numberOfTilesToAdd, out int remainingNumberOfTiles)
    {
        if (IsComplete) throw new InvalidOperationException("PatternLine already completed");
        if (TileType != null && TileType != type) throw new InvalidOperationException("Incorrect tile type");

        TileType = type;

        NumberOfTiles += numberOfTilesToAdd;
        if (NumberOfTiles > Length)
        {
            remainingNumberOfTiles = NumberOfTiles - Length;
            NumberOfTiles = Length;
        }
        else remainingNumberOfTiles = 0;
    }
}