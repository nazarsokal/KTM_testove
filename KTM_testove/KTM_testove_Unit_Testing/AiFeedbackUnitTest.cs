using System.Diagnostics;
using KTM_testove.Services;
using KTM_testove.Services.ServiceAbstractions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;
using Xunit.Abstractions;

namespace KTM_testove_Unit_Testing;

public class AiFeedbackUnitTest
{
    private readonly IParsingService _parsingService;
    private readonly IAiFeedbackService _aiFeedbackService;
    
    private readonly ITestOutputHelper _output;

    public AiFeedbackUnitTest(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task GetFeedbackAsync_ReturnsExpectedFeedback()
    {
        // 1. Arrange: Вказуємо шлях до тестового бінарного файлу логу
        var binFilePath = @"/Users/asokalch/Documents/GitHub/KTM_testove/KTM_testove/KTM_testove/wwwroot/logs/00000001.BIN";
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

        var aiService = new AiFeedbackService(new HttpClient());
        
        var feedback = await aiService.GetFeedbackAsync(actualResult);
        _output.WriteLine($"{feedback.Feedback} \n {feedback.RiskLevel}");
        _output.WriteLine("details");
        foreach (var feedbackDetail in feedback.Details)
        {
            _output.WriteLine(feedbackDetail);
        }
    }
}