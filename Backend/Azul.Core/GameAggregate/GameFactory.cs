using System.Drawing;
using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.TileFactoryAggregate;
using Azul.Core.TileFactoryAggregate.Contracts;
using Azul.Core.PlayerAggregate;
namespace Azul.Core.GameAggregate;

internal class GameFactory : IGameFactory
{
    public IGame CreateNewForTable(ITable table)
    {
        Guid gameId = Guid.NewGuid();

        var gamePlayers = new List<IPlayer>();

        foreach (var player in table.SeatedPlayers)
        {
            if (player == null) continue;

            //var gamePlayer = new HumanPlayer(player.Id, player.Name, player.LastVisitToPortugal);
            gamePlayers.Add(player);
        }

        if (gamePlayers.Count == 0)
        {
            throw new InvalidOperationException("Game must have at least one player");
        }

        var tilebag = new TileBag();
        System.Diagnostics.Debug.WriteLine($"Aantal tegels in TileBag vóór FillDisplays: {tilebag.Tiles.Count}");
        foreach (TileType tileType in Enum.GetValues(typeof(TileType)))
        {
            if (tileType != TileType.StartingTile)
            {
                tilebag.AddTiles(20, tileType);
            }
        }
        System.Diagnostics.Debug.WriteLine($"Aantal tegels in TileBag vóór FillDisplays: {tilebag.Tiles.Count}");
        System.Diagnostics.Debug.WriteLine($"Aantal displays volgens table preferences: {table.Preferences.NumberOfFactoryDisplays}");

        var tileFactory = new TileFactory(table.Preferences.NumberOfFactoryDisplays, tilebag);

        IGame game = new Game(gameId, tileFactory, gamePlayers.ToArray());

        return game; 
    }
}