using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.UserAggregate;

namespace Azul.Core.TableAggregate;

/// <inheritdoc cref="ITableFactory"/>
internal class TableFactory: ITableFactory
{
    public ITable CreateNewForUser(User user, ITablePreferences preferences)
    {
        var table = new Table(
            id: Guid.NewGuid(),
            preferences: preferences
            );

        table.Join(user);
        return table;
    }
}