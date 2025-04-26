using System.Drawing;
using Azul.Core.BoardAggregate;
using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.PlayerAggregate;

/// <inheritdoc cref="IPlayer"/>
internal class PlayerBase : IPlayer
{
    protected PlayerBase(Guid id, string name, DateOnly? lastVisitToPortugal) 
    {
        Id = id;
        Name = name;
        LastVisitToPortugal = lastVisitToPortugal;
    }

    public Guid Id { get; set; }

    public string Name { get; set; }

    public DateOnly? LastVisitToPortugal { get; set; }

    public IBoard Board { get; set; }

    public bool HasStartingTile { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }

    public List<TileType> TilesToPlace { get; set; }
}