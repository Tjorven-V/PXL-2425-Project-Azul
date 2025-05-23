using System.Drawing;
using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;

namespace Azul.Core.PlayerAggregate;

/// <inheritdoc cref="IPlayer"/>
internal class ComputerPlayer : PlayerBase
{
    private readonly IGamePlayStrategy _strategy;
    public IGamePlayStrategy Strategy => _strategy;

    public static string[] PlayerNames = {
        "Harald", "Philippe", "Gustav", "Hans", "Karl", "Lars",
        "Erik", "Johan", "Sven", "Bjorn", "Magnus", "Olof",
        "Nils", "Rune", "Stig", "Tomas", "Ulf", "Viggo",
        "Yngve", "Ziggy", "Astrid", "Birgit", "Cecilia",
        "Dahlia", "Elin", "Freja", "Greta", "Hilda", "Ingrid",
        "Jasmine", "Karin", "Lina", "Maja", "Nora", "Oda",
        "Petra", "Runa", "Saga", "Tove", "Ulla", "Vera",
        "Ylva", "Zara", "Alva", "Britt", "Clara", "Dora",
        "Elsa", "Freya", "Gina", "Hanna", "Ida", "Juna"
    };

    public static string[] EndGameMessages = {
        "Good game!", "gg", "Well played!", "Nice game!", "That was fun!",
        "I enjoyed that!", "Thanks for the game!", "I had a great time!", "That was a close one!"
    };

    public static string[] StartGameMessages =
    {
        "Let's get started!", "Ready to play!", "I'm excited to begin!", "Let's do this!",
        "Time to play!", "I'm ready for some fun!", "Let's have a great game!", "Bring it on!",
        "Good luck!", "May the best player win!", "Let's make this a memorable game!"
    };

    public ITakeTilesMove GetPreferredMove(IGame game)
    {
        return _strategy.GetBestTakeTilesMove(Id, game);
    }

    public IPlaceTilesMove GetPreferredPlaceTilesMove(IGame game)
    {
        return _strategy.GetBestPlaceTilesMove(Id, game);
    }

    public ComputerPlayer(IGamePlayStrategy strategy, string name = "Computer") : base(Guid.NewGuid(), name, null)
    {
        _strategy = strategy;
    }
}