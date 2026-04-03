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
        var result = await _parsingService.Parse(file);
        return Content(result, "application/json");
    }

    [HttpGet("ai/result/{result}")]
    public async Task<IActionResult> GetFeedback(string result)
    {
        var aiResult = await _aiiFeedbackService.GetFeedbackAsync(result);
        return Ok(aiResult);
    }
}