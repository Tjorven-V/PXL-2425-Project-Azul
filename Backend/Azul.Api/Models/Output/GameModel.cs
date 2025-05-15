using AutoMapper;
using Azul.Core.GameAggregate.Contracts;

namespace Azul.Api.Models.Output;

public class GameModel
{
    public Guid Id { get; set; }
    public PlayerModel[] Players { get; set; }
    public Guid PlayerToPlayId { get; set; }
    public TileFactoryModel TileFactory { get; set; }
    public int RoundNumber { get; set; }
    public bool HasEnded { get; set; }
    public IList<IChatMessageEntry> Chat { get; set; } // +++ Azul51 Extra : Chat Functionality +++

    private class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<IGame, GameModel>();
        }
    }
}