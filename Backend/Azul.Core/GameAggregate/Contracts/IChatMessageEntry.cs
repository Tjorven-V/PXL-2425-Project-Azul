using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

// +++ Azul51 Extra : Chat Functionality +++

namespace Azul.Core.GameAggregate.Contracts
{
    public interface IChatMessageEntry
    {
        /// <summary>
        /// The name of the player who wrote this chat message
        /// </summary>
        public string Author { get; set; }

        /// <summary>
        /// The id of the player who wrote this chat message
        /// </summary>
        public Guid AuthorId { get; set; }

        /// <summary>
        /// The text of the chat message
        /// </summary>
        public string Message { get; set; }
    }
}
