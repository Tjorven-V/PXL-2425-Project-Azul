﻿using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.GameAggregate.Contracts
{
    public interface IGame
    {
        /// <summary>
        /// The unique identifier of the game
        /// </summary>
        Guid Id { get; }

        /// <summary>
        /// The tile factory
        /// </summary>
        ITileFactory TileFactory { get; }

        /// <summary>
        /// The players (minimum 2, maximum 4) that are playing the game
        /// </summary>
        IPlayer[] Players { get; }

        /// <summary>
        /// The unique identifier of the player whose turn it is
        /// </summary>
        Guid PlayerToPlayId { get; }

        /// <summary>
        /// The round number of the game (starts at 1).
        /// A round is completed when the factory is empty and all players have placed their tiles.
        /// </summary>
        public int RoundNumber { get; }

        /// <summary>
        /// Indicates whether the game has ended (when one or more players have completed a horizontal row on their wall).
        /// </summary>
        public bool HasEnded { get; }

        /// <summary>
        /// A list of players who won the game. This will usually just be a single player, but there are cases players share a victory.
        /// </summary>
        public IReadOnlyList<Guid> WinningPlayers { get; } // +++ Azul51 Extra : Winning Players +++


        /// <summary>
        /// The last 10 chat messages sent by players.
        /// </summary>
        public IList<IChatMessageEntry> Chat { get; } // +++ Azul51 - Extra : Chat Functionality +++

        /// <summary>
        /// Takes tiles from a factory display for a player.
        /// </summary>
        /// <param name="playerId">The unique identifier of the player</param>
        /// <param name="displayId">The unique identifier of the display of the factory (the table center is considered to be a special kind of display)</param>
        /// <param name="tileType">The type of the tile to take. All tiles of this type are taken.</param>
        void TakeTilesFromFactory(Guid playerId, Guid displayId, TileType tileType);

        /// <summary>
        /// Places the tiles the player has previously taken on a pattern line.
        /// If the move succeeds, the player's turn is over.
        /// </summary>
        /// <param name="playerId">The unique identifier of the player</param>
        /// <param name="patternLineIndex">The index of the target pattern line (0 is the top line, 4 is the bottom line)</param>
        void PlaceTilesOnPatternLine(Guid playerId, int patternLineIndex);

        /// <summary>
        /// Places the tiles the player has previously taken on the floor line.
        /// If the move succeeds, the player's turn is over.
        /// </summary>
        /// <param name="playerId">The unique identifier of the player</param>
        void PlaceTilesOnFloorLine(Guid playerId);


        // +++ Azul51 Extra : Chat Functionality +++

        /// <summary>
        /// Send a chat message from a player to the game.
        /// </summary>
        /// <param name="playerId">The unique identifier of the player</param>
        /// <param name="message"> The message to send</param>
        void SendChatMessage(Guid playerId, string message);

        // --- Azul51 Extra : Chat Functionality ---

        /// <summary>
        /// Retrieve the taken tiles of the player.
        /// </summary>
        /// <param name="playerId">The unique identifier of the player</param>
        IReadOnlyCollection<TileType> GetPlayerTilesToPlace(Guid playerId);

    }
}
