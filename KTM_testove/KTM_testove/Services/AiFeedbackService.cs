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
- NO ```json
- NO explanations outside JSON
- DO NOT hallucinate
- USE ONLY PROVIDED DATA

Coordinate system:
- Z is relative altitude
- Negative altitude AFTER landing is NORMAL

Flight phases:
Takeoff → ascent → peak → descent → landing → post-landing

-------------------------------------

Analyze:
1. Performance (speed, acceleration, altitude)
2. Stability (trajectory, oscillations)
3. Safety (based on anomalies FIRST)

-------------------------------------

INPUT DATA:
{JsonConvert.SerializeObject(structuredData, Formatting.None)}

-------------------------------------

OUTPUT FORMAT:

{{
  ""feedback"": ""4-6 sentence technical summary"",
  ""details"": [""bullet points""],
  ""riskLevel"": ""LOW | MEDIUM | HIGH""
}}
";

    var body = new
    {
        model = "google/gemma-3n-e2b-it",
        messages = new[]
        {
            new { role = "system", content = "You are a strict flight analysis AI. Return ONLY valid JSON." },
            new { role = "user", content = prompt }
        },
        temperature = 0.2,
        top_p = 0.7,
        max_tokens = 512,
        stream = true
    };

    using var requestMessage = new HttpRequestMessage(HttpMethod.Post, url);
    requestMessage.Content = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json");
    requestMessage.Headers.Accept.Clear();
    requestMessage.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/event-stream"));

    using var response = await _httpClient.SendAsync(requestMessage, HttpCompletionOption.ResponseHeadersRead);
    if (!response.IsSuccessStatusCode)
        throw new Exception($"AI API returned error {response.StatusCode}");

    var textBuffer = new StringBuilder();

    // Читаємо SSE поток
    await using var stream = await response.Content.ReadAsStreamAsync();
    using var reader = new StreamReader(stream);

    while (!reader.EndOfStream)
    {
        var line = await reader.ReadLineAsync();
        if (string.IsNullOrWhiteSpace(line) || !line.StartsWith("data:"))
            continue;

        var jsonPart = line.Substring("data:".Length).Trim();
        if (jsonPart == "[DONE]") break;

        try
        {
            var chunk = JObject.Parse(jsonPart);
            var content = chunk["choices"]?[0]?["delta"]?["content"]?.ToString();
            if (!string.IsNullOrEmpty(content))
                textBuffer.Append(content);
        }
        catch
        {
            // Ігноруємо часткові фрагменти, які не є валідним JSON
        }
    }

    var text = textBuffer.ToString().Trim();

    // 🔥 fallback: якщо модель вернула текст + JSON
    var jsonStart = text.IndexOf("{");
    var jsonEnd = text.LastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart)
        text = text.Substring(jsonStart, jsonEnd - jsonStart + 1);

    try
    {
        return JsonConvert.DeserializeObject<AiAnalysisDto>(text)
               ?? new AiAnalysisDto
               {
                   Feedback = text,
                   RiskLevel = "UNKNOWN"
               };
    }
    catch
    {
        return new AiAnalysisDto
        {
            Feedback = text,
            RiskLevel = "UNKNOWN",
            Details = new List<string> { "AI returned non-structured response" }
        };
    }
}
}