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
    }

    public Guid PlayerToPlayId
    {
        get
        {
            IPlayer player1 = Players[0];
            IPlayer player2 = Players[1];

            if (!player1.LastVisitToPortugal.HasValue && !player2.LastVisitToPortugal.HasValue)
                return player1.Id;

            if (!player1.LastVisitToPortugal.HasValue)
                return player2.Id;

            if (!player2.LastVisitToPortugal.HasValue)
                return player1.Id;

            return player1.LastVisitToPortugal > player2.LastVisitToPortugal
                ? player1.Id
                : player2.Id;
        }
    }

    public int RoundNumber => throw new NotImplementedException();

    public bool HasEnded => throw new NotImplementedException();

    public void PlaceTilesOnFloorLine(Guid playerId)
    {
        throw new NotImplementedException();
    }

    public void PlaceTilesOnPatternLine(Guid playerId, int patternLineIndex)
    {
        throw new NotImplementedException();
    }

    public void TakeTilesFromFactory(Guid playerId, Guid displayId, TileType tileType)
    {
        throw new NotImplementedException();
    }
}