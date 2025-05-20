using System.ComponentModel.DataAnnotations;

namespace Azul.Api.Models.Input;

public class ChatMessageModel
{
    [Required]
    [MinLength(1)]
    [MaxLength(64)]
    public string Message { get; set; } = string.Empty;
}