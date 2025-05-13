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

        Board = new Board();
        TilesToPlace = new List<TileType>();
    }

    public Guid Id { get; set; }

    public string Name { get; set; }

    public DateOnly? LastVisitToPortugal { get; set; }

    public IBoard Board { get ; set; }

    //public bool HasStartingTile { get => TilesToPlace.Contains(TileType.StartingTile); set => throw new ArgumentNullException(); }
    public bool HasStartingTile
    {
        get => Board.FloorLine.Any(tile => tile.Type == TileType.StartingTile);
        set
        {
            if (value)
            {
                TileSpot t = Board.FloorLine[Board.FloorLine.Count(t => t.HasTile)];
                t.PlaceTile(TileType.StartingTile);
            } else
            {
                var startingTile = Board.FloorLine.FirstOrDefault(t => t.Type == TileType.StartingTile);
                startingTile?.Clear();
            }
        }
    }

    public List<TileType> TilesToPlace { get; set; }
}