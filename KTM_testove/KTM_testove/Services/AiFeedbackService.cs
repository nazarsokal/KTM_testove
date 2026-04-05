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
        ApiKey  = Environment.GetEnvironmentVariable("NVIDIA_API_KEY") ?? throw new Exception("API Key не знайдено!");
    }
    
    public async Task<AiAnalysisDto> GetFeedbackAsync(AiFeedbackRequest request, string language = "English")
    {
        using var client = new HttpClient();

        client.DefaultRequestHeaders.Authorization =
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

    IMPORTANT:
    - Use ONLY provided data
    - DO NOT hallucinate
    - Distinguish anomalies from expected behavior

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
    {JsonConvert.SerializeObject(structuredData, Formatting.Indented)}

    -------------------------------------

    Return ONLY valid JSON:

    {{
      ""feedback"": ""4-6 sentence technical summary"",
      ""details"": [""bullet points""],
      ""riskLevel"": ""LOW | MEDIUM | HIGH""
    }}
    ";

        var body = new
        {
            model = "nvidia/llama-3.3-nemotron-super-49b-v1.5",
            messages = new[]
            {
                new { role = "system", content = "You are a strict flight analysis AI. Always return valid JSON." },
                new { role = "user", content = prompt }
            },
            temperature = 0.3,
            top_p = 0.9,
            max_tokens = 2000,
            stream = false
        };

        var response = await client.PostAsync(
            url,
            new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json")
        );

        var result = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new Exception($"AI API returned error {response.StatusCode}: {result}");

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

        var text = json["choices"]?[0]?["message"]?["content"]?.ToString();

        if (string.IsNullOrWhiteSpace(text))
            throw new Exception("Empty AI response: " + result);

        text = text.Replace("```json", "")
                   .Replace("```", "")
                   .Trim();

        try
        {
            return JsonConvert.DeserializeObject<AiAnalysisDto>(text)
                   ?? new AiAnalysisDto { Feedback = text, RiskLevel = "UNKNOWN" };
        }
        catch (JsonException)
        {
            return new AiAnalysisDto
            {
                Feedback = text,
                RiskLevel = "UNKNOWN"
            };
        }
    }
}