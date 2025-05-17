using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.UserAggregate;

namespace Azul.Core.TableAggregate.Contracts;

public interface IAvailableTables
{
    /// <summary>
    /// The total amount of available tables.
    /// </summary>
    public int TablesAvailable => Tables.Count;

    /// <summary>
    /// The list of available tables.
    /// </summary>
    public IList<ITable> Tables { get; }

    /// <summary>
    /// Adds a table to the list.
    /// </summary>
    public void AddTable(ITable table);
}