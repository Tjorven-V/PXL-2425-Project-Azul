using System.Drawing;
using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;

namespace Azul.Core.PlayerAggregate;

/// <inheritdoc cref="IPlayer"/>
internal class ComputerPlayer : PlayerBase
{
    private readonly IGamePlayStrategy _strategy;
    public IGamePlayStrategy Strategy => _strategy;

    public ITakeTilesMove GetPreferredMove(IGame game)
    {
        return _strategy.GetBestTakeTilesMove(Id, game);
    }

    public IPlaceTilesMove GetPreferredPlaceTilesMove(IGame game)
    {
        return _strategy.GetBestPlaceTilesMove(Id, game);
    }

    public ComputerPlayer(IGamePlayStrategy strategy, string name = "Computer") : base(Guid.NewGuid(), name, null)
    {
        _strategy = strategy;
    }
}