using AutoMapper;
using Azul.Core.GameAggregate.Contracts;

namespace Azul.Api.Models.Output;

// +++ Azul51 Extra : Chat Functionality +++

public class ChatMessageEntryModel
{
    public PlayerModel Author { get; set; }
    public string Message { get; set; } = string.Empty;
    private class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<IChatMessageEntry, ChatMessageEntryModel>();
        }
    }
}