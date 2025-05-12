using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate;
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

        //TileFactory.TableCenter.AddStartingTile();
        //foreach (var player in Players)
        //{
        //    player.HasStartingTile = false;
        //}
    }

    public Guid PlayerToPlayId
    {
        get
        {
            //IPlayer firstPlayer = Players[0];
            //DateOnly? latestDate = null;

            //foreach (var player in Players)
            //{
            //    if (player.LastVisitToPortugal == null) continue;

            //    if (latestDate == null || player.LastVisitToPortugal > latestDate)
            //    {
            //        latestDate = player.LastVisitToPortugal;
            //        firstPlayer = player;
            //    }
            //}
            //return firstPlayer.Id;
            return _currentPlayerId;
        }
    }

    public int RoundNumber { get; private set; } = 1;

    public bool HasEnded => _hasEnded;

    public void PlaceTilesOnFloorLine(Guid playerId)
    {
        var playerToPlay = Players.FirstOrDefault(p => p.Id == playerId);

        if (playerToPlay == null)
        {
            throw new InvalidOperationException($"Player with ID {playerId} not found.");
        }

        playerToPlay.Board.AddTilesToFloorLine(playerToPlay.TilesToPlace, TileFactory);
        playerToPlay.TilesToPlace.Clear();

        int indexOfPlayerWhoPlayed = Array.FindIndex(Players, p => p.Id == playerId);
        if (indexOfPlayerWhoPlayed != -1)
        {
            int nextPlayerIndex = (indexOfPlayerWhoPlayed + 1) % Players.Length;
            _currentPlayerId = Players[nextPlayerIndex].Id;
        }
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

        bool playerWhoActedHadStartingTile = playerToPlay.HasStartingTile;

        playerToPlay.Board.AddTilesToPatternLine(playerToPlay.TilesToPlace, patternLineIndex, TileFactory);

        playerToPlay.TilesToPlace.Clear();

        bool turnDecidedByTile = false;

        if (TileFactory.IsEmpty)
        {
            IPlayer? starterForNextRound = null;

            foreach (var player in Players)
            {
                player.Board.DoWallTiling(TileFactory); 
            }

            if (playerWhoActedHadStartingTile)
            {
                starterForNextRound = playerToPlay;
            }

            bool gameEndsThisRound = Players.Any(p => p.Board.HasCompletedHorizontalLine);

            if (gameEndsThisRound)
            {
                _hasEnded = true; 
                foreach (var player in Players)
                {
                    player.Board.CalculateFinalBonusScores();
                }
            }
            else
            {
                RoundNumber++;

                foreach (var player in Players)
                {
                    if (player.HasStartingTile) starterForNextRound = player;
                }

                if (starterForNextRound != null)
                {
                    _currentPlayerId = starterForNextRound.Id;
                    turnDecidedByTile = true;
                }

                foreach (var player in Players)
                {
                    player.HasStartingTile = false;
                }
                TileFactory.TableCenter.AddStartingTile();
                TileFactory.FillDisplays();
            }
        }

        if (turnDecidedByTile) return; 

        int indexOfPlayerWhoPlayed = Array.FindIndex(Players, p => p.Id == playerId);
        if (indexOfPlayerWhoPlayed != -1)
        {
            int nextPlayerIndex = (indexOfPlayerWhoPlayed + 1) % Players.Length;
            _currentPlayerId = Players[nextPlayerIndex].Id;
        }
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