using System.Diagnostics;
using System.Text.Json;
using KTM_testove.Contracts.Response;
using KTM_testove.Services.ServiceAbstractions;
namespace KTM_testove.Services;

public class ParsingService : IParsingService
{
    private readonly IWebHostEnvironment _env;

    public ParsingService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<MissionResponse> Parse(IFormFile file)
    {
        var tempId = Guid.NewGuid().ToString();
        var tempPath = Path.Combine(Path.GetTempPath(), $"{tempId}.BIN");

        try
        {
            // 1. Зберігаємо файл
            using (var stream = new FileStream(tempPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            string wwwrootPath = _env.WebRootPath;
            string scriptPath = Path.Combine(wwwrootPath, "flight_analysis.py");

            var startInfo = new ProcessStartInfo
            {
                FileName = "python3", 
                Arguments = $"\"{scriptPath}\" \"{tempPath}\"",
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
                StandardOutputEncoding = System.Text.Encoding.UTF8
            };

            using var process = new Process { StartInfo = startInfo };
            process.Start();

            // 2. Читаємо вивід скрипта
            string output = await process.StandardOutput.ReadToEndAsync();
            string errors = await process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                throw new Exception($"Python script failed (Code {process.ExitCode}): {errors}");
            }

            // 3. ПАРСИНГ: Перетворюємо рядок output у об'єкт MissionResponse
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var result = JsonSerializer.Deserialize<MissionResponse>(output, options);

            return result ?? throw new Exception("Deserialization returned null.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Critical Exception in ParsingService: {ex.Message}");
            // У сервісах краще кидати виключення, а контролер вже нехай вирішує як їх обробляти
            throw; 
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