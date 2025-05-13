using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.GameAggregate;

/// <inheritdoc cref="IGame"/>
internal class Game : IGame
{
    public Guid Id { get; }
    public ITileFactory TileFactory { get; }
    public IPlayer[] Players { get; }

    private Guid _currentPlayerId;

    private bool _hasEnded = false;
    private Guid _nextPlayerId
    {
        get
        {
            if (TileFactory.IsEmpty && TileFactory.TableCenter.IsEmpty)
            {
                foreach (var player in Players)
                {
                    if (player.HasStartingTile)
                    {
                        return player.Id;
                    }
                }
            }

            int currentPlayerIndex = Array.FindIndex(Players, p => p.Id == _currentPlayerId);
            int nextPlayerIndex = (currentPlayerIndex + 1) % Players.Length;
            return Players[nextPlayerIndex].Id;
        }
    }
    public Guid PlayerToPlayId => _currentPlayerId;
    public int RoundNumber { get; private set; } = 1;
    public bool HasEnded => _hasEnded;

    /// <summary>
    /// Creates a new game and determines the player to play first.
    /// </summary>
    /// <param name="id">The unique identifier of the game</param>
    /// <param name="tileFactory">The tile factory</param>
    /// <param name="players">The players that will play the game</param>

    public Game(Guid id, ITileFactory tileFactory, IPlayer[] players)
    {
        Id = id;
        TileFactory = tileFactory;
        Players = players;
         
        TileFactory.TableCenter.AddStartingTile();

        foreach (var player in Players)
        {
            player.HasStartingTile = false;
        }

        TileFactory.FillDisplays();

        // initialising currentPlayerId
        if (Players == null || Players.Length == 0)
        {
            throw new ArgumentException("Game must have at least one player.", nameof(players));
        }

        IPlayer firstPlayer = Players[0];
        if (Players.Length > 1)
        {
            DateOnly? latestDate = null;
            foreach (var player in Players)
            {
                if (player.LastVisitToPortugal.HasValue)
                {
                    if (!latestDate.HasValue || player.LastVisitToPortugal.Value > latestDate.Value)
                    {
                        latestDate = player.LastVisitToPortugal.Value;
                        firstPlayer = player;
                    }
                }
            }
        }

        _currentPlayerId = firstPlayer.Id;
    }

    private void PrepareNextRound()
    {
        _currentPlayerId = _nextPlayerId;

        if (TileFactory.IsEmpty && TileFactory.TableCenter.IsEmpty)
        {
            foreach (var player in Players)
            {
                player.Board.DoWallTiling(TileFactory);
                player.HasStartingTile = false;
            }

            TileFactory.FillDisplays();
            TileFactory.TableCenter.AddStartingTile();

            RoundNumber++;
        }
    }

    public void PlaceTilesOnFloorLine(Guid playerId)
    {
        var playerToPlay = Players.FirstOrDefault(p => p.Id == playerId);

        if (playerToPlay == null)
        {
            throw new InvalidOperationException($"Player with ID {playerId} not found.");
        }

        playerToPlay.Board.AddTilesToFloorLine(playerToPlay.TilesToPlace, TileFactory);
        playerToPlay.TilesToPlace.Clear();

        PrepareNextRound();
    }

    public void PlaceTilesOnPatternLine(Guid playerId, int patternLineIndex)
    {
        var playerToPlay = Players.FirstOrDefault(p => p.Id == playerId);
        if (playerToPlay == null)
        {
            throw new InvalidOperationException($"Player with ID {playerId} not found.");
        }

        if (playerId != _currentPlayerId)
        {
            throw new InvalidOperationException("It is not this player's turn.");
        }

        if (!playerToPlay.TilesToPlace.Any())
        {
            throw new InvalidOperationException("Player has no tiles to place.");
        }

        playerToPlay.Board.AddTilesToPatternLine(playerToPlay.TilesToPlace, patternLineIndex, TileFactory);
        //PlaceTilesOnFloorLine(playerId);
        playerToPlay.TilesToPlace.Clear();

        bool gameEndsThisRound = Players.Any(p => p.Board.HasCompletedHorizontalLine);
        if (gameEndsThisRound)
        {
            _hasEnded = true;
            foreach (var p in Players)
            {
                p.Board.CalculateFinalBonusScores();
            }
        }

        PrepareNextRound();
    }

    public void TakeTilesFromFactory(Guid playerId, Guid displayId, TileType tileType)
    {
        var player = Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null)
        {
            throw new InvalidOperationException("Player not found.");
        }

        if (playerId != PlayerToPlayId)
        {
            throw new InvalidOperationException("not your turn.");
        }

        if (player.TilesToPlace.Any())
        {
            throw new InvalidOperationException("Player already has tiles to place.");
        }

        var takenTiles = TileFactory.TakeTiles(displayId, tileType);
        player.TilesToPlace.AddRange(takenTiles);

        if (takenTiles.Contains(TileType.StartingTile))
        {
            player.HasStartingTile = true;
        }
    }
}