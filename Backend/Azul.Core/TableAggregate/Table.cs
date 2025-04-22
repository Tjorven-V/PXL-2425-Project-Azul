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

    public Guid Id { get; set; }

    public ITablePreferences Preferences { get; set; }

    public IReadOnlyList<IPlayer> SeatedPlayers { get; set; }

    public bool HasAvailableSeat => SeatedPlayers.Count < 4;

    public Guid GameId { get; set;  }

    public void FillWithArtificialPlayers(IGamePlayStrategy gamePlayStrategy)
    {
        throw new NotImplementedException();
    }

    public void Join(User user)
    {
        throw new NotImplementedException();
    }

    public void Leave(Guid userId)
    {
        throw new NotImplementedException();
    }
}