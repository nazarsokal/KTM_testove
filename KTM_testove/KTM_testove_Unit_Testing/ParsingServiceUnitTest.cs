using System.IO;
using System.Threading.Tasks;
using System.Text.Json; 
using Microsoft.AspNetCore.Http;
using Xunit;
using KTM_testove.Services;
using Microsoft.AspNetCore.Hosting;
using Moq;

namespace KTM_testove_Unit_Testing; 

public class ParsingServiceUnitTest
{
    [Fact]
    public async Task Parse_ValidBinFile_ReturnsCorrectData()
    {
        // 1. Arrange: Вказуємо шлях до тестового бінарного файлу логу
        var binFilePath = @"/Users/asokalch/Documents/GitHub/KTM_testove/KTM_testove/KTM_testove/wwwroot/logs/00000019.BIN";
        Assert.True(File.Exists(binFilePath), $"Тестовий файл не знайдено за шляхом: {binFilePath}");

        // Створюємо IFormFile
        using var stream = new FileStream(binFilePath, FileMode.Open, FileAccess.Read);
        IFormFile formFile = new FormFile(stream, 0, stream.Length, "file", Path.GetFileName(binFilePath))
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/octet-stream"
        };
        
        var mockEnv = new Mock<IWebHostEnvironment>();
        
        // --- ВИПРАВЛЕННЯ 1 ---
        // Вказуємо справжній шлях до wwwroot, щоб ParsingService зміг знайти flight_analysis.py
        var realWwwrootPath = @"/Users/asokalch/Documents/GitHub/KTM_testove/KTM_testove/KTM_testove/wwwroot";
        mockEnv.Setup(env => env.WebRootPath).Returns(realWwwrootPath);

        // --- ВИПРАВЛЕННЯ 2 ---
        // Додаємо .Object, бо конструктор чекає IWebHostEnvironment, а не Mock<IWebHostEnvironment>
        var service = new ParsingService(mockEnv.Object); 

        // 2. Act: Викликаємо метод парсингу
        var actualResult = await service.Parse(formFile);

        // 3. Assert: Перевіряємо СТРУКТУРУ отриманого JSON
        Assert.NotNull(actualResult);
        Assert.DoesNotContain("\"error\"", actualResult); // Переконуємося, що скрипт не повернув помилку

        // Парсимо результат у JsonDocument для зручної перевірки структури
        using var jsonDoc = JsonDocument.Parse(actualResult);
        var root = jsonDoc.RootElement;

        // --- Перевірка головних вузлів ---
        Assert.True(root.TryGetProperty("metadata", out var metadata), "JSON не містить об'єкт 'metadata'");
        Assert.True(root.TryGetProperty("summary", out var summary), "JSON не містить об'єкт 'summary'");
        Assert.True(root.TryGetProperty("trajectory", out var trajectory), "JSON не містить масив 'trajectory'");

        // --- Перевірка вкладеної структури: Metadata ---
        Assert.True(metadata.TryGetProperty("mission_id", out var missionId), "Відсутній 'mission_id'");
        Assert.Equal(JsonValueKind.String, missionId.ValueKind); // Перевіряємо, що це рядок

        Assert.True(metadata.TryGetProperty("reference_wgs84", out var refWgs), "Відсутній 'reference_wgs84'");
        Assert.True(refWgs.TryGetProperty("lat", out _), "Відсутня широта (lat)");
        Assert.True(refWgs.TryGetProperty("lon", out _), "Відсутня довгота (lon)");
        Assert.True(refWgs.TryGetProperty("alt", out _), "Відсутня висота (alt)");

        // --- Перевірка вкладеної структури: Summary ---
        Assert.True(summary.TryGetProperty("max_vertical_speed", out _));
        Assert.True(summary.TryGetProperty("max_horizontal_speed", out _));
        Assert.True(summary.TryGetProperty("duration_seconds", out var duration));
        Assert.Equal(JsonValueKind.Number, duration.ValueKind); // Має бути числом

        // --- Перевірка вкладеної структури: Trajectory ---
        Assert.Equal(JsonValueKind.Array, trajectory.ValueKind); // Це має бути масив
        Assert.True(trajectory.GetArrayLength() > 0, "Масив trajectory порожній!");

        // Беремо першу точку масиву і перевіряємо її структуру
        var firstPoint = trajectory[0];
        Assert.True(firstPoint.TryGetProperty("t", out var t), "Точка траєкторії не має часу 't'");
        Assert.Equal(JsonValueKind.Number, t.ValueKind);

        Assert.True(firstPoint.TryGetProperty("pos", out var pos), "Точка траєкторії не має позиції 'pos'");
        Assert.Equal(JsonValueKind.Array, pos.ValueKind); // Позиція [x, y, z] має бути масивом
        Assert.Equal(3, pos.GetArrayLength()); // Має містити рівно 3 координати

        Assert.True(firstPoint.TryGetProperty("vel", out var vel), "Точка траєкторії не має швидкості 'vel'");
        Assert.Equal(JsonValueKind.Number, vel.ValueKind);
    }
}