﻿using AutoMapper;
using Azul.Api.Models.Output;
using Azul.Core.TableAggregate;
using Azul.Core.TableAggregate.Contracts;
using Azul.Core.UserAggregate;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace Azul.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TablesController : ApiControllerBase
{
    private readonly ITableManager _tableManager;
    private readonly ITableRepository _tableRepository;
    private readonly IMapper _mapper;
    private readonly UserManager<User> _userManager;

    public TablesController(ITableManager tableManager, ITableRepository tableRepository, IMapper mapper, UserManager<User> userManager)
    {
        _tableManager = tableManager;
        _tableRepository = tableRepository;
        _mapper = mapper;
        _userManager = userManager;
    }

    /// <summary>
    /// Gets a specific table by its id.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(TableModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetTableById(Guid id)
    {
        ITable table = _tableRepository.Get(id);
        TableModel model = _mapper.Map<TableModel>(table);
        return Ok(model);
    }

    /// <summary>
    /// Searches a table with available seats that matches the given preferences.
    /// If such a table is found, the user joins it.
    /// If no table is found, a new table is created and the user joins the new table.
    /// If the table has no available seats left, the game is started.
    /// </summary>
    /// <param name="preferences">
    /// Contains info about the type of game you want to play.
    /// </param>
    /// <remarks>Tables are automatically removed from the system after 15 minutes.</remarks>
    [HttpPost("join-or-create")]
    [ProducesResponseType(typeof(TableModel), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorModel), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> JoinOrCreate([FromBody] TablePreferences preferences)
    {
        User currentUser = (await _userManager.GetUserAsync(User))!;
        ITable table = _tableManager.JoinOrCreateTable(currentUser, preferences);

        if(!table.HasAvailableSeat)
        {
            _tableManager.StartGameForTable(table.Id);
        }

        TableModel tableModel = _mapper.Map<TableModel>(table);

        return Ok(tableModel);
    }

    /// <summary>
    /// Join a table manually.
    /// </summary>
    /// <param name="id">
    /// The unique identifier of the table.
    /// </param>
    [HttpPost("{id}/join")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorModel), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Join(Guid id)
    {
        User currentUser = (await _userManager.GetUserAsync(User))!;
        var joinedTable = _tableManager.JoinTable(id, currentUser);

        if (!joinedTable.HasAvailableSeat)
        {
            _tableManager.StartGameForTable(joinedTable.Id);
        }

        var table = _mapper.Map<TableModel>(joinedTable);
        return Ok(table);
    }

    /// <summary>
    /// Removes the user that is logged in from a table.
    /// If no players are left at the table, the table is removed from the system.
    /// </summary>
    /// <param name="id">
    /// The unique identifier of the table.
    /// </param>
    [HttpPost("{id}/leave")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorModel), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Leave(Guid id)
    {
        User currentUser = (await _userManager.GetUserAsync(User))!;
        _tableManager.LeaveTable(id, currentUser);
        return Ok();
    }

    // +++ Azul51 Extra : List of all tables +++
    /// <summary>
    /// Azul51 Extra : Table Browser: Gets all available tables.
    /// </summary>
    [HttpGet("")]
    [ProducesResponseType(typeof(AvailableTablesModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetAllTables()
    {
        AvailableTablesModel availableTables = new();
        foreach (var table in _tableRepository.Tables)
        {
            TableModel tableModel = _mapper.Map<TableModel>(table);
            availableTables.AddTable(tableModel);
        }
        return Ok(availableTables);
    }
    // --- Azul51 Extra : List of all tables ---

    // +++ Azul51 Extra : Get player current table +++
    /// <summary>
    /// Azul51 Extra : Table Browser: Get the player's current table.
    /// </summary>
    [HttpGet("get-current-table")]
    [ProducesResponseType(typeof(TableModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult GetCurrentTable()
    {
        foreach (var table in _tableRepository.Tables)
        {
            if (table.SeatedPlayers.Any(p => p.Id == UserId))
            {
                TableModel tableModel = _mapper.Map<TableModel>(table);
                return Ok(tableModel);
            }
        }
        return NoContent();
    }
    // --- Azul51 Extra : Get player current table ---
}