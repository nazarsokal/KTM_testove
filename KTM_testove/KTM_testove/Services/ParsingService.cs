using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using KTM_testove.Contracts.Response;
using KTM_testove.Services.ServiceAbstractions;

namespace KTM_testove.Services;

public class ParsingService : IParsingService
{
    private readonly IWebHostEnvironment _env;
    private readonly IMemoryCache _cache;

    public ParsingService(IWebHostEnvironment env, IMemoryCache cache)
    {
        _env = env;
        _cache = cache;
    }

    public async Task<MissionResponse> Parse(IFormFile file)
    {
        // 1. Створюємо унікальний ключ на основі контенту файлу (SHA256)
        string fileHash = await GetFileHash(file);
        string cacheKey = $"Mission_{fileHash}";

        // 2. Спробуємо отримати результат з кешу
        if (_cache.TryGetValue(cacheKey, out MissionResponse cachedResult))
        {
            Console.WriteLine("Дані отримано з КЕШУ.");
            return cachedResult;
        }

        // Якщо в кеші немає, виконуємо звичну логіку
        var tempPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.BIN");
        try 
        {
            using (var stream = new FileStream(tempPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            string output = await RunPythonScript(tempPath);

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var result = JsonSerializer.Deserialize<MissionResponse>(output, options);

            if (result != null)
            {
                // 3. Зберігаємо результат у кеш (наприклад, на 30 хвилин)
                var cacheEntryOptions = new MemoryCacheEntryOptions()
                    .SetSlidingExpiration(TimeSpan.FromMinutes(30))
                    .SetAbsoluteExpiration(TimeSpan.FromHours(1));

                _cache.Set(cacheKey, result, cacheEntryOptions);
            }

            return result;
        }
        finally 
        {
            if (File.Exists(tempPath)) File.Delete(tempPath);
        }
    }

    private async Task<string> GetFileHash(IFormFile file)
    {
        using var sha256 = SHA256.Create();
        using var stream = file.OpenReadStream();
        byte[] hashBytes = await sha256.ComputeHashAsync(stream);
        return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
    }

    private async Task<string> RunPythonScript(string filePath)
    {
        string scriptPath = Path.Combine(_env.WebRootPath, "flight_analysis.py");
        var startInfo = new ProcessStartInfo
        {
            FileName = "python3",
            Arguments = $"\"{scriptPath}\" \"{filePath}\"",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
            StandardOutputEncoding = System.Text.Encoding.UTF8
        };

        using var process = new Process { StartInfo = startInfo };
        process.Start();
        string output = await process.StandardOutput.ReadToEndAsync();
        string errors = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        if (process.ExitCode != 0)
            throw new Exception($"Python error: {errors}");

        return output;
    }
}