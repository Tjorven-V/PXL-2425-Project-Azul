using System.Drawing;
using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.PlayerAggregate;

/// <inheritdoc cref="IPlayer"/>
internal class HumanPlayer : IPlayer
{
    public Guid Id { get; }
    public string Name { get; }
    public DateOnly? LastVisitToPortugal { get; }
    public IBoard Board { get; }
    public bool HasStartingTile { get; set; }
    public List<TileType> TilesToPlace { get; }

    public HumanPlayer(Guid userId, string name, DateOnly? lastVisitToPortugal)
    {
        Id = userId;
        Name = name;
        LastVisitToPortugal = lastVisitToPortugal;
    }
}