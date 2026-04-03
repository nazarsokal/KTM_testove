using System.Text;
using KTM_testove.DTOs;
using KTM_testove.Services.ServiceAbstractions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace KTM_testove.Services;

public class AiFeedbackService : IAiFeedbackService
{
    private readonly HttpClient _httpClient;
    private const string ApiKey = "AIzaSyAEGATSkUTv5LSP0G2IFhGqlrw9uQdLikA";

    public AiFeedbackService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }
    
    public async Task<AiAnalysisDto> GetFeedbackAsync(string parameters)
{
    using var client = new HttpClient();

    // Використовуємо API key у URL
    var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={ApiKey}";

    // Правильна структура запиту для Gemini 2.5 Flash
    var body = new
    {
        contents = new[]
        {
            new
            {
                parts = new[]
                {
                    new
                    {
                        text = $@"
You are an expert UAV (drone) flight analysis system.

Analyze the following drone flight metrics ONLY based on the data provided. Follow these rules:
- Do NOT invent data
- Do NOT add assumptions
- Be precise and technical
- If no issues, explicitly state flight is stable

INPUT DATA:
{parameters}

ANALYSIS INSTRUCTIONS:
1. Evaluate flight performance
2. Identify abnormal or unsafe values:
   - Very high acceleration (>30 m/s^2)
   - Sudden vertical changes
   - Unstable or inconsistent speeds
3. Assess flight stability
4. Determine risk level (LOW / MEDIUM / HIGH)

OUTPUT FORMAT (STRICT JSON, NO MARKDOWN):

{{
  ""feedback"": ""Concise technical summary of the flight"",
  ""details"": [
    ""List of detected issues or confirmations of stability""
  ],
  ""riskLevel"": ""LOW | MEDIUM | HIGH""
}}"
                    }
                }
            }
        }
    };

    var response = await client.PostAsync(
        url,
        new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json")
    );

    var result = await response.Content.ReadAsStringAsync();

    // Перевірка статусу
    if (!response.IsSuccessStatusCode)
        throw new Exception($"AI API returned error {response.StatusCode}: {result}");

    // Логування для дебагу
    Console.WriteLine("AI raw response: " + result);

    JObject json;
    try
    {
        json = JObject.Parse(result);
    }
    catch (JsonException)
    {
        throw new Exception("AI response is not valid JSON: " + result);
    }

    // Отримуємо текст відповіді
    var text = json["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString()
               ?? throw new Exception("Empty AI response: " + result);

    // Чистимо можливі markdown обгортки
    text = text.Replace("```json", "").Replace("```", "").Trim();

    try
    {
        // Десеріалізуємо у AiAnalysisDto
        return JsonConvert.DeserializeObject<AiAnalysisDto>(text)
               ?? new AiAnalysisDto { Feedback = text, RiskLevel = "UNKNOWN" };
    }
    catch (JsonException)
    {
        // Якщо JSON некоректний, повертаємо текст з RiskLevel = UNKNOWN
        return new AiAnalysisDto
        {
            Feedback = text,
            RiskLevel = "UNKNOWN"
        };
    }
}
}