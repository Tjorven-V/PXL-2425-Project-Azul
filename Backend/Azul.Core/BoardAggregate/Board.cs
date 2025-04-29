using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.BoardAggregate;

/// <inheritdoc cref="IBoard"/>
internal class Board : IBoard
{
    public IPatternLine[] PatternLines { get; set; } = { };

    public TileSpot[,] Wall { get; set; } = { };

    public TileSpot[] FloorLine { get; set; } = { };

    public int Score { get; set; } = 0; 

    public bool HasCompletedHorizontalLine { get; set; } = false;

    public void AddTilesToFloorLine(IReadOnlyList<TileType> tilesToAdd, ITileFactory tileFactory)
    {
        
    }

    public void AddTilesToPatternLine(IReadOnlyList<TileType> tilesToAdd, int patternLineIndex, ITileFactory tileFactory)
    {
    }

    public void CalculateFinalBonusScores()
    {
    }

    public void DoWallTiling(ITileFactory tileFactory)
    {
    }
}