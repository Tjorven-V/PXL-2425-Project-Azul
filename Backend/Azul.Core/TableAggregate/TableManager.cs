using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.UserAggregate;

namespace Azul.Core.TableAggregate;

/// <inheritdoc cref="ITableManager"/>
internal class TableManager : ITableManager
{
    private readonly ITableRepository _tableRepository;
    private readonly ITableFactory _tableFactory;
    private readonly IGameRepository _gameRepository;
    private readonly IGameFactory _gameFactory;
    private readonly IGamePlayStrategy _gamePlayStrategy;

    public TableManager(
        ITableRepository tableRepository,
        ITableFactory tableFactory,
        IGameRepository gameRepository,
        IGameFactory gameFactory,
        IGamePlayStrategy gamePlayStrategy)
    {
        _tableRepository = tableRepository;
        _tableFactory = tableFactory;
        _gameRepository = gameRepository;
        _gameFactory = gameFactory;
        _gamePlayStrategy = gamePlayStrategy;
    }

    public ITable JoinOrCreateTable(User user, ITablePreferences preferences)
    {
        //Find a table with available seats that matches the given preferences
        //If no table is found, create a new table. Otherwise, take the first available table
        throw new NotImplementedException();
    }

    public void LeaveTable(Guid tableId, User user)
    {
        throw new NotImplementedException();
    }


    public IGame StartGameForTable(Guid tableId)
    {
        throw new NotImplementedException();
    }

    public void FillWithArtificialPlayers(Guid tableId, User user)
    {
        //TODO: Implement this method when you are working on the EXTRA requirement 'Play against AI'
        throw new NotImplementedException();
    }
}