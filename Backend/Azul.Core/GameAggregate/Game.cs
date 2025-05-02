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
            IPlayer firstPlayer = Players[0];
            DateOnly? latestDate = null;

            foreach (var player in Players)
            {
                if (player.LastVisitToPortugal == null) continue;

                if (latestDate == null || player.LastVisitToPortugal > latestDate)
                {
                    latestDate = player.LastVisitToPortugal;
                    firstPlayer = player;
                }
            }
            return firstPlayer.Id;
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