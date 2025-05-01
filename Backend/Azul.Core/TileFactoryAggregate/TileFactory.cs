using Azul.Core.TileFactoryAggregate.Contracts;
using System.Runtime.CompilerServices;

namespace Azul.Core.TileFactoryAggregate;

internal class TileFactory : ITileFactory
{
    private readonly List<IFactoryDisplay> _displays = new List<IFactoryDisplay>();
    public ITableCenter tableCenter { get; set; } = new TableCenter();
    internal TileFactory(int numberOfDisplays, ITileBag bag)
    {
        Bag = bag;
        TableCenter = tableCenter ;
        
        for(int i = 0; i < numberOfDisplays; i++) 
        {
            _displays.Add(new FactoryDisplay(TableCenter));
        }

        UsedTiles = new List<TileType>();
    }

    public ITileBag Bag  { get; set; }

    public IReadOnlyList<IFactoryDisplay> Displays => _displays;

    public ITableCenter TableCenter { get; set; }

    public IReadOnlyList<TileType> UsedTiles { get; set; }

    public bool IsEmpty => _displays.All(d => d.IsEmpty);

    public void AddToUsedTiles(TileType tile)
    {
        throw new NotImplementedException();
    }

    public void FillDisplays()
    {
        throw new NotImplementedException();
    }

    public IReadOnlyList<TileType> TakeTiles(Guid displayId, TileType tileType)
    {
        throw new NotImplementedException();
    }
}