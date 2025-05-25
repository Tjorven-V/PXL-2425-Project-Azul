using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.GameAggregate;
using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.PlayerAggregate;

class PatternLineDisplayFiller {
    public int PatternLineIndex { get; }
    public TileType TileType { get; }
    public IFactoryDisplay FactoryDisplay { get; }

    public PatternLineDisplayFiller(int patternLineIndex, TileType tileType, IFactoryDisplay factoryDisplay)
    {
        PatternLineIndex = patternLineIndex;
        TileType = tileType;
        FactoryDisplay = factoryDisplay;
    }
}

internal class GamePlayStrategy : IGamePlayStrategy
{
    private int _preferredPatternLineIndex = -1;

    private static bool PatternLineHasTileOfTypeOnWall(IBoard board, int patternLineIndex, TileType tileType)
    {
        for (int i = 0; i < 5; i++)
        {
            var tileSpot = board.Wall[patternLineIndex, i];
            if (tileSpot.Type == tileType && tileSpot.HasTile)
            {
                return true;
            }
        }

        return false;
    }

    private IEnumerable<PatternLineDisplayFiller> EmptyPatternLinesThatCanBeCompleted(IBoard playerBoard, IEnumerable<IFactoryDisplay> displaysToSearch)
    {
        List<PatternLineDisplayFiller> patternLineDisplayFillers = [];

        for (int patternLineIndex = 0; patternLineIndex < playerBoard.PatternLines.Length; patternLineIndex++)
        {
            var patternLine = playerBoard.PatternLines[patternLineIndex];

            if (patternLine.NumberOfTiles != 0) continue; // This line is not empty

            // YES IT CAN BECAUSE OF THE CENTER
            //if (patternLine.Length == 5) continue; // This can never be filled in one move

            foreach (var factoryDisplay in displaysToSearch)
            {
                foreach (var tileType in factoryDisplay.Tiles)
                {
                    if (PatternLineHasTileOfTypeOnWall(playerBoard, patternLineIndex, tileType))
                    {
                        continue;
                    }

                    if (factoryDisplay.Tiles.Count(t => t == tileType) == patternLine.Length)
                    {
                        patternLineDisplayFillers.Add(new PatternLineDisplayFiller(patternLineIndex, tileType, factoryDisplay));
                    }
                }
            }
        }

        return [.. patternLineDisplayFillers];
    }

    private IEnumerable<PatternLineDisplayFiller> PartialPatternLinesThatCanBeCompleted(IBoard playerBoard, IEnumerable<IFactoryDisplay> displaysToSearch)
    {
        List<PatternLineDisplayFiller> patternLineDisplayFillers = [];

        for (int patternLineIndex = 0; patternLineIndex < playerBoard.PatternLines.Length; patternLineIndex++)
        {
            var patternLine = playerBoard.PatternLines[patternLineIndex];
            if (patternLine.NumberOfTiles == 0) continue; // This line is empty

            int tilesRemaining = patternLine.Length - patternLine.NumberOfTiles;
            if (tilesRemaining == 0) continue; // This line is already full

            var requiredType = patternLine.TileType;

            foreach (var factoryDisplay in displaysToSearch)
            {
                foreach (var groupedTiles in factoryDisplay.Tiles.GroupBy(t => t))
                {
                    if (groupedTiles.Key != requiredType || groupedTiles.Count() < tilesRemaining) continue;
                    patternLineDisplayFillers.Add(new PatternLineDisplayFiller(patternLineIndex, groupedTiles.Key, factoryDisplay));
                }
            }
        }

        return patternLineDisplayFillers;
    }

    private IEnumerable<PatternLineDisplayFiller> EmptyPatternLineToFillPartially(IBoard playerBoard, IEnumerable<IFactoryDisplay> displaysToSearch)
    {

        // This might be the most complex move yet
        List<PatternLineDisplayFiller> underfilledPatternLines = [];
        List<Dictionary<PatternLineDisplayFiller, int>> overfilledPatternLines = []; // int is amount of overfilled tiles
        // This is important, as the AI will prefer to take one tile and put it on the floor line rather than
        // taking 5 tiles and ending up having to put 4 on the floorline

        List<PatternLineDisplayFiller> patternLineDisplayFillers = [];

        for (int patternLineIndex = 0; patternLineIndex < playerBoard.PatternLines.Length; patternLineIndex++)
        {
            var patternLine = playerBoard.PatternLines[patternLineIndex];

            if (patternLine.NumberOfTiles != 0) continue; // This line is not empty
 
            foreach (var factoryDisplay in displaysToSearch)
            {
                foreach (var groupedTiles in factoryDisplay.Tiles.GroupBy(t => t))
                {
                    if (PatternLineHasTileOfTypeOnWall(playerBoard, patternLineIndex, groupedTiles.Key)) continue;

                    if (groupedTiles.Count() <= patternLine.Length) {
                        underfilledPatternLines.Add(new PatternLineDisplayFiller(patternLineIndex, groupedTiles.Key, factoryDisplay));
                    } else
                    {
                        overfilledPatternLines.Add(new Dictionary<PatternLineDisplayFiller, int> {
                            {
                                new PatternLineDisplayFiller(patternLineIndex, groupedTiles.Key, factoryDisplay),
                                groupedTiles.Count() - patternLine.Length
                            }
                        });
                    }
                }
            }
        }

        if (underfilledPatternLines.Count > 0)
        {
            patternLineDisplayFillers = [.. underfilledPatternLines];
        }
        else
        {
            int maxAcceptableOverflow = 2; // This is the maximum amount of tiles that can be overfilled before the AI prefers to take one tile and put it on the floor line
            foreach (var overfilledPatternLine in overfilledPatternLines)
            {
                foreach (var patternLineDisplayFiller in overfilledPatternLine)
                {
                    var move = patternLineDisplayFiller.Key;
                    var overfilledTiles = patternLineDisplayFiller.Value;

                    if (overfilledTiles > maxAcceptableOverflow && overfilledPatternLines.Count > 1)
                    {
                        continue;
                    }

                    patternLineDisplayFillers.Add(move);
                }
            }
        }

        return [.. patternLineDisplayFillers];
    }

    private IEnumerable<PatternLineDisplayFiller> PartialPatternLineToFillPartially(IBoard playerBoard, IEnumerable<IFactoryDisplay> displaysToSearch)
    {
        List<PatternLineDisplayFiller> patternLineDisplayFillers = [];

        for (int patternLineIndex = 0; patternLineIndex < playerBoard.PatternLines.Length; patternLineIndex++)
        {
            var patternLine = playerBoard.PatternLines[patternLineIndex];

            if (patternLine.NumberOfTiles == 0) continue; // This line is empty
            if (patternLine.IsComplete) continue; // This line is already full

            int tilesRemaining = patternLine.Length - patternLine.NumberOfTiles;
            TileType requiredType = patternLine.TileType.Value; // This can never be null if there are tiles placed (unless we fucked up somewhere)

            foreach (var factoryDisplay in displaysToSearch)
            {
                foreach (var groupedTiles in factoryDisplay.Tiles.GroupBy(t => t))
                {
                    if (groupedTiles.Key != requiredType) continue; // wrong type
                    if (groupedTiles.Count() > tilesRemaining) continue; // too many tiles

                    patternLineDisplayFillers.Add(new PatternLineDisplayFiller(patternLineIndex, groupedTiles.Key, factoryDisplay));
                }
            }
        }

        return [.. patternLineDisplayFillers];
    }

    private TakeTilesMove FindBestMove(IBoard playerBoard, IEnumerable<IFactoryDisplay> displaysToSearch, out int preferredPatternLine)
    {
        Console.Write("- - - - - Looking for partial pattern lines that can be completed...");
        // If no empty pattern line can be filled in one move, check if there are any lines that can be completed
        PatternLineDisplayFiller[] partialLinesThatCanBeCompleted = [.. PartialPatternLinesThatCanBeCompleted(playerBoard, displaysToSearch)];
        if (partialLinesThatCanBeCompleted.Length > 0)
        {
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("\tOK");
            Console.ResetColor();
            // Prefer to fill the largest pattern line
            preferredPatternLine = partialLinesThatCanBeCompleted[^1].PatternLineIndex;
            return new TakeTilesMove(partialLinesThatCanBeCompleted[^1].FactoryDisplay, partialLinesThatCanBeCompleted[^1].TileType);
        }
        else
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("\tFAIL");
        }
        Console.ResetColor();

        // Determine if any EMPTY pattern line can be filled in one move
        Console.Write("- - - - - Looking for empty pattern lines that can be filled in one move...");
        PatternLineDisplayFiller[] linesThatCanBeCompleted = [.. EmptyPatternLinesThatCanBeCompleted(playerBoard, displaysToSearch)];
        if (linesThatCanBeCompleted.Length > 0)
        {
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("\tOK");
            Console.ResetColor();
            preferredPatternLine = linesThatCanBeCompleted[^1].PatternLineIndex; // ^1 is the last element in the array? cool
            return new TakeTilesMove(linesThatCanBeCompleted[^1].FactoryDisplay, linesThatCanBeCompleted[^1].TileType);
        } else
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("\tFAIL");
        }
        Console.ResetColor();

        // Determine if any PARTIAL pattern line can be filled partially
        Console.Write("- - - - - Looking for partial lines that can be partially filled...");
        PatternLineDisplayFiller[] partialLinesThatCanBePartiallyFilled = [.. PartialPatternLineToFillPartially(playerBoard, displaysToSearch)];
        if (partialLinesThatCanBePartiallyFilled.Length > 0)
        {
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("\tOK");
            Console.ResetColor();
            preferredPatternLine = partialLinesThatCanBePartiallyFilled[^1].PatternLineIndex; // ^1 is the last element in the array? cool
            return new TakeTilesMove(partialLinesThatCanBePartiallyFilled[^1].FactoryDisplay, partialLinesThatCanBePartiallyFilled[^1].TileType);
        }
        else
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("\tFAIL");
        }
        Console.ResetColor();

        Console.Write("- - - - - Looking for empty pattern lines that can be filled partially...");
        PatternLineDisplayFiller[] emptyLinesToPartiallyFill = [.. EmptyPatternLineToFillPartially(playerBoard, displaysToSearch)];
        if (emptyLinesToPartiallyFill.Length > 0)
        {
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("\tOK");
            Console.ResetColor();
            // Prefer to fill the largest pattern line
            preferredPatternLine = emptyLinesToPartiallyFill[^1].PatternLineIndex;
            return new TakeTilesMove(emptyLinesToPartiallyFill[^1].FactoryDisplay, emptyLinesToPartiallyFill[^1].TileType);
        }
        else
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("\tFAIL");
        }
        Console.ResetColor();

        Console.Write("- - - - - No empty pattern lines that can be filled partially without overflowing too much.\nLooking for any one tile to take.");
        IFactoryDisplay preferedDisplay = null;
        TileType preferedTileType = TileType.StartingTile;
        int tilesThatWouldBeTaken = int.MaxValue;
        foreach (var factoryDisplay in displaysToSearch)
        {
            foreach (var groupedTiles in factoryDisplay.Tiles.GroupBy(t => t))
            {
                if (groupedTiles.Count() < tilesThatWouldBeTaken)
                {
                    preferedDisplay = factoryDisplay;
                    preferedTileType = groupedTiles.Key;
                    tilesThatWouldBeTaken = groupedTiles.Count();
                }
            }
        }
        if (preferedDisplay != null && preferedTileType != TileType.StartingTile)
        {
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("\tOK");
            Console.ResetColor();
            preferredPatternLine = -2;
            return new(preferedDisplay, preferedTileType);
        }
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine("\tFAIL");
        Console.WriteLine("Failed to find any move at all, zoinks.");
        Console.ResetColor();
        preferredPatternLine = -1;
        return null;
    }

    public ITakeTilesMove GetBestTakeTilesMove(Guid playerId, IGame game)
    {
        _preferredPatternLineIndex = -1;

        var player = game.Players.FirstOrDefault(p => p.Id == playerId) ?? throw new ArgumentException($"Player with ID {playerId} not found in the game.");
        var playerBoard = player.Board;

        var factoryDisplays = game.TileFactory.Displays.Where(d => !d.IsEmpty);
        var tableCenter = game.TileFactory.TableCenter as IFactoryDisplay; // Table center is just another factory display as far as the AI is concerned
        bool centerHasStartingTile = tableCenter.Tiles.Contains(TileType.StartingTile);

        // If the starting tile is no longer in the center, or all available displays are empty, check it too.
        List<IFactoryDisplay> displaysToSearch = [.. factoryDisplays];
        if (!centerHasStartingTile || !factoryDisplays.Any()) displaysToSearch.Add(tableCenter);

        Console.WriteLine("Searching for best move. Searching center? " + !centerHasStartingTile);
        ITakeTilesMove bestMove = FindBestMove(playerBoard, displaysToSearch, out _preferredPatternLineIndex);
        if (bestMove != null)
        {
            Console.WriteLine("Found Move!");
            return bestMove;
        }

        // if the center has the starting tile, it was not searched.
        if (centerHasStartingTile)
        {
            Console.WriteLine("Searching center");
            bestMove = FindBestMove(playerBoard, [tableCenter], out _preferredPatternLineIndex);
            if (bestMove != null)
            {
                Console.WriteLine("Found Move in center!");
                return bestMove;
            }
        }

        Console.WriteLine("No preferred pattern line found. Searching for any tile to take from the first display.");
        // Welp, we tried everything. Just take the first tile from the first display. It'll most likely end up on the floor line.
        displaysToSearch = [.. factoryDisplays, tableCenter];
        var firstDisplay = displaysToSearch.FirstOrDefault();
        return new TakeTilesMove(firstDisplay, firstDisplay.Tiles[0]);
    }

    public IPlaceTilesMove GetBestPlaceTilesMove(Guid playerId, IGame game)
    {
        if (_preferredPatternLineIndex == -2)
        {
            return PlaceTilesMove.CreateMoveOnFloorLine();
        }

        if (_preferredPatternLineIndex >= 0)
        {
            // preferred line is available, so use it
            return PlaceTilesMove.CreateMoveOnPatternLine(_preferredPatternLineIndex);
        }
        // No preferred line available, so... Lets see if we can do anything.

        var player = game.Players.FirstOrDefault(p => p.Id == playerId) ?? throw new ArgumentException($"Player with ID {playerId} not found in the game.");
        var playerBoard = player.Board;

        var tilesToPlace = player.TilesToPlace;
        var tileType = tilesToPlace.Where(t => t != TileType.StartingTile).FirstOrDefault();

        for (int patternLineIndex = 0; patternLineIndex < playerBoard.PatternLines.Length; patternLineIndex++)
        {
            var patternLine = playerBoard.PatternLines[patternLineIndex];
            if (patternLine.IsComplete) continue; // Full line
            if (patternLine.TileType != tileType) continue; // Wrong tile type

            return PlaceTilesMove.CreateMoveOnPatternLine(patternLineIndex); // Good enough
        }

        Console.WriteLine("Default FloorLine Behaviour");
        return PlaceTilesMove.CreateMoveOnFloorLine(); // No other options available
    }
}