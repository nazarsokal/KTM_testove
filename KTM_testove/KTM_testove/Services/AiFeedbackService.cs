using System.Net.Http.Headers;
using System.Text;
using KTM_testove.Contracts.Request;
using KTM_testove.DTOs;
using KTM_testove.Services.ServiceAbstractions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace KTM_testove.Services;

public class AiFeedbackService : IAiFeedbackService
{
    private readonly HttpClient _httpClient;
    private readonly string ApiKey;

    public AiFeedbackService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        ApiKey  = Environment.GetEnvironmentVariable("NVIDIA_API_KEY_GEMINI") ?? throw new Exception("API Key не знайдено!");
    }
    
public async Task<AiAnalysisDto> GetFeedbackAsync(AiFeedbackRequest request, string language = "English")
{
    _httpClient.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", ApiKey);

    var url = "https://integrate.api.nvidia.com/v1/chat/completions";

    var pointsSample = request.Points
        .Take(20)
        .ToList();

    var structuredData = new
    {
        summary = request.SummaryRequest,
        events = request.Events,
        points = pointsSample
    };

    var prompt = $@"
You are an expert UAV / rocket flight analysis system.

Respond ONLY in {language}.

STRICT RULES:
- RETURN ONLY VALID JSON
- NO markdown
- NO explanations
- DO NOT hallucinate
- USE ONLY PROVIDED DATA

IMPORTANT:
- details MUST be an array of plain strings
- DO NOT use objects inside details

Coordinate system:
- Z is relative altitude
- Negative altitude AFTER landing is NORMAL

Flight phases:
Takeoff → ascent → peak → descent → landing → post-landing

-------------------------------------

ANALYSIS INSTRUCTIONS:
1. Include specific numerical values (speed, altitude, acceleration, angles, time).
2. details = 5-10 bullet points as STRINGS (not objects).
3. RiskLevel must be: LOW, MEDIUM, or HIGH.
4. Feedback = 4-6 sentences with numbers.

INPUT DATA:
{JsonConvert.SerializeObject(structuredData, Formatting.None)}

-------------------------------------

STRICT JSON SCHEMA:

{{
  ""feedback"": ""string"",
  ""details"": [""string""],
  ""riskLevel"": ""LOW | MEDIUM | HIGH""
}}
";

    var body = new
    {
        model = "google/gemma-3n-e2b-it",
        messages = new[]
        {
            new { role = "system", content = "Return ONLY valid JSON." },
            new { role = "user", content = prompt }
        },
        temperature = 0.2,
        top_p = 0.7,
        max_tokens = 512,
        stream = false // 🔥 ВИМКНУЛИ STREAMING
    };

    using var requestMessage = new HttpRequestMessage(HttpMethod.Post, url);
    requestMessage.Content = new StringContent(
        JsonConvert.SerializeObject(body),
        Encoding.UTF8,
        "application/json"
    );

    var response = await _httpClient.SendAsync(requestMessage);

    if (!response.IsSuccessStatusCode)
        throw new Exception($"AI API returned error {response.StatusCode}");

    var responseString = await response.Content.ReadAsStringAsync();

    try
    {
        var json = JObject.Parse(responseString);

        var content = json["choices"]?[0]?["message"]?["content"]?.ToString();

        if (string.IsNullOrWhiteSpace(content))
            throw new Exception("Empty AI response");

        content = content.Trim();

        // 🔥 fallback: витягуємо JSON якщо модель додала текст
        var jsonStart = content.IndexOf("{");
        var jsonEnd = content.LastIndexOf("}");

        if (jsonStart >= 0 && jsonEnd > jsonStart)
            content = content.Substring(jsonStart, jsonEnd - jsonStart + 1);

        var result = JsonConvert.DeserializeObject<AiAnalysisDto>(content);

        if (result == null)
            throw new Exception("Deserialization returned null");

        return result;
    }
    catch
    {
        return new AiAnalysisDto
        {
            Feedback = "Failed to parse AI response",
            RiskLevel = "UNKNOWN",
            Details = new List<string> { responseString }
        };
    }
}
}