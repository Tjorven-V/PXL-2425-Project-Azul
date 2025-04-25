using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.TableAggregate;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.GameAggregate;

/// <inheritdoc cref="IGameService"/>
internal class GameService : IGameService
{
    private readonly IGameRepository _gameRepository;

    public GameService(IGameRepository gameRepository)
    {
        _gameRepository = gameRepository;
    }
    public IGame GetGame(Guid gameId)
    {
        // 1. Getting game from the repository
        return _gameRepository.GetById(gameId);

    }
    public void TakeTilesFromFactory(Guid gameId, Guid playerId, Guid displayId, TileType tileType)
    {
        var game = _gameRepository.GetById(gameId);
        game.TakeTilesFromFactory(playerId, displayId, tileType);
    }

    public void PlaceTilesOnPatternLine(Guid gameId, Guid playerId, int patternLineIndex)
    {
        var game = _gameRepository.GetById(gameId);
        game.PlaceTilesOnPatternLine(playerId, patternLineIndex);
    }

    public void PlaceTilesOnFloorLine(Guid gameId, Guid playerId)
    {
        var game = _gameRepository.GetById(gameId);
        game.PlaceTilesOnFloorLine(playerId);
    }
}