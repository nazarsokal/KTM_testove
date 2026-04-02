using System.Diagnostics;
using KTM_testove.Contracts.Response;
using KTM_testove.Services.ServiceAbstractions;

namespace KTM_testove.Services;


public class ParcingService : IParcingService
{
    async Task<FlightAnalysisResponse> Parse(IFormFile file)
    {
        var tempPath = Path.GetTempFileName();
        using (var stream = new FileStream(tempPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }


        var startInfo = new ProcessStartInfo
        {
            FileName = "python",
            // Передаємо шлях до скрипта та шлях до тимчасового файлу як аргумент
            Arguments = $"script.py \"{tempPath}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        using var process = new Process{StartInfo = startInfo};
        process.Start();
        string output = await process.StandardOutput.ReadToEndAsync();
        string errors = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();
       
        
        if (process.ExitCode != 0)
        {
            return null;
        }
        else
        {
            //jkhfkugf
        }
    }
}