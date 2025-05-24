using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;
using System.Numerics;

namespace Azul.Core.GameAggregate;

/// <inheritdoc cref="IGame"/>
internal class Game : IGame
{
    public Guid Id { get; }
    public ITileFactory TileFactory { get; }
    public IPlayer[] Players { get; }

    private Guid _currentPlayerId;

    private bool _hasEnded = false;

    private IReadOnlyList<Guid> _winningPlayers;
    public IReadOnlyList<Guid> WinningPlayers {
        get {
            if (!_hasEnded)
            {
                return [];
            }

            if (_winningPlayers != null)
            {
                return _winningPlayers;
            }

            if (Players.Length == 1)
            {
                _winningPlayers = [Players[0].Id];
                return _winningPlayers; // If there's only one player, they are the winner by default.
            }

            List<Guid> determinedWinners = [];

            List<IPlayer> playersWithCompletedLine = new List<IPlayer>();

            foreach (var player in Players)
            {
                if (player.Board.HasCompletedHorizontalLine)
                {
                    playersWithCompletedLine.Add(player);
                }
            }

            if (playersWithCompletedLine.Count == 1)
            {
                determinedWinners = [playersWithCompletedLine[0].Id];
            } else
            {
                int highestScore = playersWithCompletedLine.Max(p => p.Board.Score);
                List<IPlayer> winningPlayers = [.. playersWithCompletedLine.Where(p => p.Board.Score == highestScore)];
                determinedWinners = [.. winningPlayers.Select(p => p.Id)];
            }

            _winningPlayers = determinedWinners;
            return determinedWinners;
        }
    } // +++ Azul51 Extra : Winning Players +++

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
    public IList<IChatMessageEntry> Chat { get; private set; } // +++ Azul51 - Extra : Chat Functionality +++

    private Random _rand = new Random();

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
        Chat = []; // +++ Azul51 - Extra : Chat Functionality +++

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

                if (player is ComputerPlayer)
                {
                    Chat.Add(new ChatMessageEntry(player, ComputerPlayer.StartGameMessages[_rand.Next(ComputerPlayer.StartGameMessages.Length)]));
                }
            }
        }

        _currentPlayerId = firstPlayer.Id;
    }

    private void PrepareNextRound()
    {
        if (TileFactory.IsEmpty && TileFactory.TableCenter.IsEmpty)
        {
            _currentPlayerId = _nextPlayerId;
            foreach (var player in Players)
            {
                player.Board.DoWallTiling(TileFactory);
                player.HasStartingTile = false;
            }

            bool gameEndsThisRound = Players.Any(p => p.Board.HasCompletedHorizontalLine);
            if (gameEndsThisRound)
            {
                _hasEnded = true;
                foreach (var player in Players)
                {
                    player.Board.CalculateFinalBonusScores();

                    if (gameEndsThisRound && player is ComputerPlayer)
                    {
                        SendChatMessage(player.Id, ComputerPlayer.EndGameMessages[_rand.Next(ComputerPlayer.EndGameMessages.Length)]);
                    }
                }
            }

            if (gameEndsThisRound)
            {
                Console.WriteLine($"Game {Id} has ended.");
                _currentPlayerId = Guid.Empty;
                return;
            }

            TileFactory.FillDisplays();
            TileFactory.TableCenter.AddStartingTile();

            RoundNumber++;
        } else
        {
            _currentPlayerId = _nextPlayerId;
            Console.WriteLine($"Next player: {_currentPlayerId}");
        }

        StartAITurn();
    }

    private void StartAITurn()
    {
        Task.Run(AIPlayerTurn); // Run this on a new thread so it doesnt block the HTTP request from the player
    }

    private async void AIPlayerTurn()
    {
        var playerToPlay = Players.FirstOrDefault(p => p.Id == _currentPlayerId);
        if (playerToPlay is not ComputerPlayer)
        {
            Console.WriteLine("This player is not AI");
            return;
        }
        Console.WriteLine("This player is AI!");

        await Task.Delay(TimeSpan.FromSeconds(_rand.NextDouble() * 3.5 + 2.5)); // Simulate delay for AI player turn

        if (HasEnded)
        {
            Console.WriteLine("Game has ended, AI player turn stopped.");
            return;
        }

        var aiPlayer = playerToPlay as ComputerPlayer;

        var takeTilesMove = aiPlayer.GetPreferredMove(this);
        TakeTilesFromFactory(aiPlayer.Id, takeTilesMove.FactoryDisplayId, takeTilesMove.TileType);

        var placeTilesMove = aiPlayer.GetPreferredPlaceTilesMove(this);
        if (placeTilesMove.PatternLineIndex == -1)
        {
            PlaceTilesOnFloorLine(aiPlayer.Id);
        }
        else
        {
            PlaceTilesOnPatternLine(aiPlayer.Id, placeTilesMove.PatternLineIndex);
        }
    }

    public void PlaceTilesOnFloorLine(Guid playerId)
    {
        if (HasEnded)
        {
            throw new InvalidOperationException("The game has ended!");
        }

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
        if (HasEnded)
        {
            throw new InvalidOperationException("The game has ended!");
        }

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

        PrepareNextRound();
    }

    public void TakeTilesFromFactory(Guid playerId, Guid displayId, TileType tileType)
    {
        if (HasEnded)
        {
            throw new InvalidOperationException("The game has ended!");
        }

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

    // +++ Azul51 - Extra : Chat Functionality +++
    public void SendChatMessage(Guid playerId, string message)
    {
        var player = Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null)
        {
            throw new InvalidOperationException("Player not found.");
        }
        
        Chat.Add(new ChatMessageEntry(player, message));
        if (Chat.Count > 10)
        {
            Chat.RemoveAt(0);
        }
    }
    // --- Azul51 - Extra : Chat Functionality ---

    public IReadOnlyCollection<TileType> GetPlayerTilesToPlace(Guid playerId)
    {
        var player = Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null)
        {
            throw new InvalidOperationException("Player not found.");
        }

        return player.TilesToPlace;
    }
}