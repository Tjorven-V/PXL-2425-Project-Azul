using System.ComponentModel.Design;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.Util;
using Azul.Infrastructure.Util;

namespace Azul.Infrastructure;

/// <inheritdoc cref="ITableRepository"/>
internal class InMemoryTableRepository : ITableRepository
{
    private readonly ExpiringDictionary<Guid, ITable> _tableDictionary;
    public IList<ITable> Tables => _tableDictionary.Values.ToList();

    public InMemoryTableRepository()
    {
        _tableDictionary = new ExpiringDictionary<Guid, ITable>(TimeSpan.FromMinutes(15));
    }

    public void Add(ITable table)
    {
        _tableDictionary.AddOrReplace(table.Id, table);
    }

    public ITable Get(Guid tableId)
    {
        if (_tableDictionary.TryGetValue(tableId, out ITable table))
        {
            return table!;
        }
        throw new DataNotFoundException();
    }

    public void Remove(Guid tableId)
    {
        _tableDictionary.TryRemove(tableId, out ITable _);
    }

    public IList<ITable> FindTablesWithAvailableSeats(ITablePreferences preferences)
    {
        IList<ITable> availableTables = [];

        foreach (var table in _tableDictionary.Values)
        {
            if (!table.HasAvailableSeat) continue;

            var tablePreferences = table.Preferences;
            if (tablePreferences == null) continue;

            if ( // Not-matching preferences
                tablePreferences.NumberOfPlayers != preferences.NumberOfPlayers ||
                tablePreferences.NumberOfArtificialPlayers != preferences.NumberOfArtificialPlayers
                ) continue;

            availableTables.Add(table);
        }

        return availableTables;
    }

    public ITable FindTable(Guid tableId)
    {
        foreach (var table in _tableDictionary.Values)
        {
            if (table.Id == tableId)
            {
                return table;
            }
        }
        throw new DataNotFoundException();
    }
}