using System.Drawing;
using System.Numerics;
using System.Text;
using Azul.Core.PlayerAggregate;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.UserAggregate;

namespace Azul.Core.TableAggregate;

/// <inheritdoc cref="ITable"/>
internal class Table : ITable
{

    internal Table(Guid id, ITablePreferences preferences)
    {
        Id = id;
        Preferences = preferences;
        SeatedPlayers = new List<IPlayer>();
    }

    public Guid Id { get;}

    public ITablePreferences Preferences { get; }

    public IReadOnlyList<IPlayer> SeatedPlayers { get; private set; }

    public bool HasAvailableSeat => SeatedPlayers.Count < Preferences.NumberOfPlayers;

    public Guid GameId { get; set;  }

    public void FillWithArtificialPlayers(IGamePlayStrategy gamePlayStrategy)
    {
        throw new NotImplementedException();
    }

    public void Join(User user)
    {
        if (SeatedPlayers.Any(p => p.Id == user.Id))
        {
            throw new InvalidOperationException("User is already seated at the table");
        }
        if (!HasAvailableSeat)
            throw new InvalidOperationException("Table is full");

        var players = new List<IPlayer>(SeatedPlayers ?? Enumerable.Empty<IPlayer>())
        {
            new HumanPlayer(user.Id, user.UserName, user.LastVisitToPortugal)
        };
        SeatedPlayers = players;
    }

    public void Leave(Guid userId)
    {
        var players = new List<IPlayer>(SeatedPlayers);
        var player = players.FirstOrDefault(p => p.Id == userId);
        if (player == null)
        {
            throw new InvalidOperationException("User is not seated");
        }
        players.Remove(player);
        SeatedPlayers = players;
    }
}