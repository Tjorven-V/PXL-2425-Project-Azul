using System.Xml.Schema;
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
        if (preferences.NumberOfPlayers < 0 || preferences.NumberOfArtificialPlayers < 0)
        {
            if (preferences.NumberOfPlayers < 1)
            {
                throw new InvalidOperationException("Game must have at least one player.");
            }
            if (preferences.NumberOfArtificialPlayers < 0)
            {
                throw new InvalidOperationException("Number of artificial players cannot be negative.");
            }
            if (preferences.NumberOfArtificialPlayers > 3)
            {
                throw new InvalidOperationException("Game cannot have more than 3 AI players.");
            }
            if (preferences.NumberOfArtificialPlayers >= preferences.NumberOfPlayers)
            {
                throw new InvalidOperationException("Number of artificial players must be less than total number of players.");
            }
            throw new InvalidOperationException("Game cannot have negative players");
        }

        if (preferences.NumberOfPlayers - preferences.NumberOfArtificialPlayers < 0)
        {
            throw new InvalidOperationException("Game cannot have 0 human players");
        }

        if (preferences.NumberOfArtificialPlayers > 3)
        {
            throw new InvalidOperationException("Game cannot have more than 3 AI players");
        }
        if (preferences.NumberOfPlayers < 1 && preferences.NumberOfArtificialPlayers < 1)
        {
            throw new InvalidOperationException("Game cannot have less than 1 player without at least 1 AI player");
        }


        IList<ITable> availableTables = _tableRepository.FindTablesWithAvailableSeats(preferences);

        if (availableTables == null || availableTables.Count == 0) {
            ITable newTable = _tableFactory.CreateNewForUser(user, preferences);
            _tableRepository.Add(newTable);
            return newTable;
        }

        ITable firstAvailableTable = availableTables[0];
        firstAvailableTable.Join(user);
        return firstAvailableTable;

        //Find a table with available seats that matches the given preferences
        //If no table is found, create a new table. Otherwise, take the first available table
    }

    public ITable JoinTable(Guid tableId, User user)
    {
        ITable Table = _tableRepository.FindTable(tableId);
        Table.Join(user);
        return Table;
    }
    public void LeaveTable(Guid tableId, User user)
    {
        ITable table = _tableRepository.Get(tableId);

        table.Leave(user.Id);
        if (table.SeatedPlayers.Count == 0) 
        {
            _tableRepository.Remove(tableId);
        }    
    }


    public IGame StartGameForTable(Guid tableId)
    {
        // 1. Getting table from the repository
        var table = _tableRepository.Get(tableId);

        // 2. Check if there are enough players
        if (table.SeatedPlayers.Count < table.Preferences.NumberOfPlayers)
        {
            throw new InvalidOperationException("Not enough players to start a game.");
        }

        // 3. Create new game for this table
        FillWithArtificialPlayers(tableId, new User());
        var game = _gameFactory.CreateNewForTable(table);

        // 4. Save the game in the repository
        _gameRepository.Add(game);

        // 5. Set table's game id to the new game's id
        table.GameId = game.Id;

        // 6. Return the new game
        return game;
    }

    public void FillWithArtificialPlayers(Guid tableId, User user)
    {
        var table = _tableRepository.Get(tableId);
        table.FillWithArtificialPlayers(_gamePlayStrategy);
    }
}