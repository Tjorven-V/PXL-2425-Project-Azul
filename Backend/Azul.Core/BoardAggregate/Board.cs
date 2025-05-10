using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.TableAggregate;
using Azul.Core.TileFactoryAggregate;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.BoardAggregate;

/// <inheritdoc cref="IBoard"/>
internal class Board : IBoard
{
    public IPatternLine[] PatternLines { get; private set; }

    public TileSpot[,] Wall { get; private set; }

    public TileSpot[] FloorLine { get; private set; }

    public int Score { get; set; } = 0; 

    public bool HasCompletedHorizontalLine {
        get
        {
            bool hasCompleteRow = false;

            for (int row = 0; row < 5; row++)
            {
                bool isRowComplete = true;
                for (int column = 0; column < 5; column++)
                {
                    var spot = Wall[row, column];
                    if (!spot.HasTile)
                    {
                        isRowComplete = false;
                        break;
                    }
                }
                if (isRowComplete)
                {
                    hasCompleteRow = true;
                    break;
                }
            }

            return hasCompleteRow;
        }
    }

    public Board()
    {
        PatternLines = new IPatternLine[5];

        PatternLines[0] = new PatternLine(1);
        PatternLines[1] = new PatternLine(2);
        PatternLines[2] = new PatternLine(3);
        PatternLines[3] = new PatternLine(4);
        PatternLines[4] = new PatternLine(5);

        Wall = new TileSpot[5, 5]
        {
            {
                new TileSpot(TileType.PlainBlue),
                new TileSpot(TileType.YellowRed),
                new TileSpot(TileType.PlainRed),
                new TileSpot(TileType.BlackBlue),
                new TileSpot(TileType.WhiteTurquoise)
            },
            {
                new TileSpot(TileType.WhiteTurquoise),
                new TileSpot(TileType.PlainBlue),
                new TileSpot(TileType.YellowRed),
                new TileSpot(TileType.PlainRed),
                new TileSpot(TileType.BlackBlue)
            },
            {
                new TileSpot(TileType.BlackBlue),
                new TileSpot(TileType.WhiteTurquoise),
                new TileSpot(TileType.PlainBlue),
                new TileSpot(TileType.YellowRed),
                new TileSpot(TileType.PlainRed)
            },
            {
                new TileSpot(TileType.PlainRed),
                new TileSpot(TileType.BlackBlue),
                new TileSpot(TileType.WhiteTurquoise),
                new TileSpot(TileType.PlainBlue),
                new TileSpot(TileType.YellowRed)
            },
            {
                new TileSpot(TileType.YellowRed),
                new TileSpot(TileType.PlainRed),
                new TileSpot(TileType.BlackBlue),
                new TileSpot(TileType.WhiteTurquoise),
                new TileSpot(TileType.PlainBlue)
            }
        };

        FloorLine = [
            new(), new(), new(), new(), new(), new(), new()
        ];
    }

    public void AddTilesToFloorLine(IReadOnlyList<TileType> tilesToAdd, ITileFactory tileFactory)
    {
        int availableSpots = FloorLine.Count(spot => spot.HasTile == false);
        int takenSpots = FloorLine.Length - availableSpots;

        for (int i = 0; i < tilesToAdd.Count; i++)
        {
            TileType type = tilesToAdd[i];

            if (!FloorLine.Any(spot => spot.HasTile == false))
            {
                tileFactory.AddToUsedTiles(type);
               
            } else
            {
                FloorLine[takenSpots + i].PlaceTile(type);
            }
        }
    }

    public void AddTilesToPatternLine(IReadOnlyList<TileType> tilesToAdd, int patternLineIndex, ITileFactory tileFactory)
    {
        TileType typeToAdd = tilesToAdd[0];
        if (typeToAdd == TileType.StartingTile)
        {
            AddTilesToFloorLine([TileType.StartingTile], tileFactory);
            tilesToAdd = [.. tilesToAdd.Skip(1).ToList()];
            typeToAdd = tilesToAdd[0];
        }

        // check if tile already completed in wall
        for (int i = 0; i < 5;  i++)
        {
            var tileSpot = Wall[patternLineIndex, i];
            if (tileSpot.Type == typeToAdd)
            {
                if (tileSpot.HasTile) throw new InvalidOperationException("wall already has this type of tile placed");
                break;
            }
        }

        var patternLine = PatternLines[patternLineIndex];
        patternLine.TryAddTiles(typeToAdd, tilesToAdd.Count, out int remainingTiles);
        AddTilesToFloorLine([.. Enumerable.Repeat(typeToAdd, remainingTiles)], tileFactory);
    }

    private int CalculateColourBonus()
    {
        // Flatten the 2D array to a one dimensional array.
        // This will basically append each row to the last
        IEnumerable<TileSpot> flattenedWall = Wall.Cast<TileSpot>();

        // LINQ!
        var tileTypeGroups = flattenedWall
            .Where(spot => spot.HasTile) // Filter out every tile that isn't placed
            .GroupBy(spot => spot.Type); // Group them by their type

        int amountOfCompletedGroups = tileTypeGroups
            .Count(group => group.Count() == 5); // Then check which groups are completed!

        // Add the score
        return 10 * amountOfCompletedGroups;
    }

    private int CalculateVerticalBonus()
    {
        int verticalLines = 0;

        for (int column = 0; column < 5; column++)
        {
            bool isColumnComplete = true;
            for (int row = 0; row < 5; row++)
            {
                if (!Wall[row, column].HasTile)
                {
                    isColumnComplete = false;
                    break;
                }
            }
            if (isColumnComplete) verticalLines++;
        }

        return 7 * verticalLines;
    }

    private int CalculateHorizontalBonus()
    {
        int horizontalLines = 0;

        for (int column = 0; column < 5; column++)
        {
            bool isRowComplete = true;
            for (int row = 0; row < 5; row++)
            {
                if (!Wall[column, row].HasTile)
                {
                    isRowComplete = false;
                    break;
                }
            }
            if (isRowComplete) horizontalLines++;
        }

        return 2 * horizontalLines;
    }

    private int ProcessFloorTiles(ITileFactory factory)
    {
        int scoreLoss = 0;
        for (int i = 0; i < FloorLine.Length; i++)
        {
            if (FloorLine[i].HasTile)
            {
                if (i < 2)
                {
                    scoreLoss += 1;
                }
                else if (i < 5)
                {
                    scoreLoss += 2;
                }
                else
                {
                    scoreLoss += 3;
                }

                if (FloorLine[i].Type != TileType.StartingTile)
                {
                    factory.AddToUsedTiles(FloorLine[i].Type.Value);
                }
            }
        }
        return scoreLoss;
    }

    public void CalculateFinalBonusScores()
    {
        int colourBonus = CalculateColourBonus();
        int verticalBonus = CalculateVerticalBonus();
        int horizontalBonus = CalculateHorizontalBonus();

        Score = Score + colourBonus + verticalBonus + horizontalBonus;
    }

    public void DoWallTiling(ITileFactory tileFactory)
    {
        //foreach (var patternLine in PatternLines)
        for (int i = 0; i < PatternLines.Length; i++)
        {
            var patternLine = PatternLines[i];
            if (!patternLine.IsComplete) continue;

            var type = patternLine.TileType.Value;

            TileSpot wallSpot = null;
            int x = 0;
            int y = 0;

            for (int j = 0; j < 5; j++)
            {
                var checkingSpot = Wall[i, j];
                if (!checkingSpot.HasTile && checkingSpot.Type == type)
                {
                    wallSpot = checkingSpot;
                    x = i;
                    y = j;
                    break;
                }
            }

            if (wallSpot != null)
            {
                wallSpot.PlaceTile(type);

                // calculate score (kill me)
                Score++;

                bool horizontal = false;
                bool vertical = false;

                for (int left = 1; left < 5; left++)
                {
                    if (0 <= x - left)
                    {
                        if (Wall[x - left, y].HasTile)
                        {
                            Score++;
                            horizontal = true;
                        }
                        else break;
                    }
                    else break;
                }

                for (int right = 1; right < 5; right++)
                {
                    if (x + right <= 4)
                    {
                        if (Wall[x + right, y].HasTile)
                        {
                            Score++;
                            horizontal = true;
                        }
                        else break;
                    }
                    else break;
                }

                for (int up = 1; up < 5; up++)
                {
                    if (0 <= y - up)
                    {
                        if (Wall[x, y - up].HasTile)
                        {
                            Score++;
                            vertical = true;
                        }
                        else break;
                    }
                    else break;
                }

                for (int down = 1; down < 5; down++)
                {
                    if (y + down <= 4)
                    {
                        if (Wall[x, y + down].HasTile)
                        {
                            Score++;
                            vertical = true;
                        }
                        else break;
                    }
                    else break;
                }

                // Account for intersection
                if (horizontal && vertical) Score++;

                for (int k = 0; k < patternLine.Length - 1; k++)
                {
                    tileFactory.AddToUsedTiles(type);
                }

                patternLine.Clear();
            }
        }

        Score -= ProcessFloorTiles(tileFactory);
    }
}