using System.Diagnostics;
using KTM_testove.Contracts.Response;
using KTM_testove.Services.ServiceAbstractions;

namespace KTM_testove.Services;


public class ParsingService : IParsingService
{
    private readonly IWebHostEnvironment _env;

    // Впроваджуємо залежність через конструктор
    public ParsingService(IWebHostEnvironment env)
    {
        _env = env;
    }
    public async Task<string> Parse(IFormFile file)
{
    // Створюємо тимчасовий файл з розширенням .BIN, 
    // оскільки pymavlink часто орієнтується на розширення
    var tempId = Guid.NewGuid().ToString();
    var tempPath = Path.Combine(Path.GetTempPath(), $"{tempId}.BIN");

    try
    {
        // Зберігаємо файл на диск
        using (var stream = new FileStream(tempPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }
        string wwwrootPath = _env.WebRootPath;
        string scriptPath = Path.Combine(wwwrootPath, "flight_analysis.py");
        var startInfo = new ProcessStartInfo
        {
            FileName = "python",
            // Використовуємо лапки для шляхів, щоб уникнути помилок з пробілами
            Arguments = $"\"{scriptPath}\" \"{tempPath}\"",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
            StandardOutputEncoding = System.Text.Encoding.UTF8,
            StandardErrorEncoding = System.Text.Encoding.UTF8
        };
        using var process = new Process { StartInfo = startInfo };
        process.Start();
        var outputTask = process.StandardOutput.ReadToEndAsync();
        var errorTask = process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();
        string output = await outputTask;
        string errors = await errorTask;
        if (process.ExitCode != 0)
        {
            Console.WriteLine($"Python Process Exit Code: {process.ExitCode}");
            Console.WriteLine($"Python Error: {errors}");
            return errors.StartsWith("{") ? errors : $"{{\"error\": \"Python script failed\", \"details\": \"{errors.Trim()}\"}}";
        }

        return output;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Critical Exception in ParcingService: {ex.Message}");
        return $"{{\"error\": \"Internal server error\", \"message\": \"{ex.Message}\"}}";
    }
    finally
    {
        if (File.Exists(tempPath))
        {
            try { File.Delete(tempPath); } catch { /* ignore */ }
        }
    }
}
}