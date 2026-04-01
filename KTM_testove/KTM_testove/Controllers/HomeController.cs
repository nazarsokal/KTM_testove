using Microsoft.AspNetCore.Mvc;

namespace KTM_testove.Controllers;

public class HomeController : ControllerBase
{
    public IActionResult Index()
    {
        return Ok("Hello World!");
    }
}