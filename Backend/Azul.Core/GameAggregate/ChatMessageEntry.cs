using System.Drawing;
using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
namespace Azul.Core.GameAggregate;

// +++ Azul51 Extra : Chat Functionality +++

internal class ChatMessageEntry : IChatMessageEntry
{
    public string Author { get; set; }
    public Guid AuthorId { get; set; }
    public string Message { get; set; }

    public ChatMessageEntry(IPlayer author, string message)
    {
        Author = author.Name;
        AuthorId = author.Id;
        Message = message;
    }
}