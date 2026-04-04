using KTM_testove.Services.ServiceAbstractions;
using Microsoft.AspNetCore.Mvc;

namespace KTM_testove.Controllers;

[ApiController]
public class HomeController : ControllerBase
{
    private readonly IParsingService _parsingService;
    private readonly IAiFeedbackService _aiiFeedbackService;

    public HomeController(IParsingService parsingService, IAiFeedbackService aiiFeedbackService)
    {
        _parsingService = parsingService;
        _aiiFeedbackService = aiiFeedbackService;
    }

    [HttpPost]
    [Route("/file/load")]
    public async Task<IActionResult> LoadFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("Файл не вибрано або він порожній.");
        }

        try
        {
            var result = await _parsingService.Parse(file);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("ai/result/{result}")]
    public async Task<IActionResult> GetFeedback(string result)
    {
        var aiResult = await _aiiFeedbackService.GetFeedbackAsync(result);
        return Ok(aiResult);
    }
}