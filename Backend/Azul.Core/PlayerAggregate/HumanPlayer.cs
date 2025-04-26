using System.Drawing;
using System.Runtime.InteropServices.Marshalling;
using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.PlayerAggregate;

/// <inheritdoc cref="IPlayer"/>
internal class HumanPlayer : PlayerBase
{
    public HumanPlayer(Guid userId, string name, DateOnly? lastVisitToPortugal)
        :base(userId, name, lastVisitToPortugal)
    {}
}