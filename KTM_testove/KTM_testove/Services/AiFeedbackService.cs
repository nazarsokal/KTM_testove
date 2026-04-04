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
        ApiKey = configuration["GoogleApi:ApiKey"] 
                  ?? throw new Exception("API Key не знайдено!");
    }
    
    public async Task<AiAnalysisDto> GetFeedbackAsync(AiFeedbackRequest request, string language = "English")
    {
        using var client = new HttpClient();

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={ApiKey}";
        
        var pointsSample = request.Points
            .Take(20)
            .ToList();

        var structuredData = new
        {
            summary = request.SummaryRequest,
            events = request.Events,
            anomalies = request.Anomalies,
            points = pointsSample
        };

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
                            You are an expert UAV / rocket flight analysis system.
                            
                            **IMPORTANT:** Respond **exclusively in {language}**.
                            
                            You MUST analyze ALL provided data sources:
                            - summary: aggregated flight metrics
                            - events: key flight milestones
                            - anomalies: pre-detected anomalies (high priority)
                            - points: raw telemetry (time series)

                            -------------------------------------
                            IMPORTANT DOMAIN CONTEXT:

                            Coordinate system:
                            - Position is in a LOCAL coordinate system relative to launch point
                            - Z (altitude) is RELATIVE, not absolute above sea level
                            - Negative altitude AFTER landing can be valid and should NOT be treated as a critical anomaly by default

                            Flight phases:
                            - Takeoff → ascent → peak altitude → descent → landing → post-landing data
                            - Velocity dropping to 0 AFTER landing is NORMAL behavior

                            -------------------------------------
                            STRICT RULES:
                            - Use ONLY provided data
                            - DO NOT invent values
                            - DO NOT assume crashes unless clearly indicated
                            - Distinguish between REAL anomalies and EXPECTED behavior
                            - Prioritize: anomalies > events > summary > raw points

                            -------------------------------------
                            ANALYSIS INSTRUCTIONS:

                            1. Flight Performance:
                               - Evaluate speeds, acceleration, altitude profile
                               - Comment on efficiency and consistency

                            2. Stability Analysis:
                               - Analyze trajectory smoothness
                               - Detect oscillations or sudden attitude changes
                               - Validate using telemetry points

                            3. Safety Assessment:
                               - Use anomalies list FIRST
                               - Correlate with events
                               - Ignore expected post-landing behavior

                            4. Risk Classification:
                               - HIGH → loss of control, extreme values, critical anomalies
                               - MEDIUM → noticeable instability or suspicious behavior
                               - LOW → stable and nominal flight

                            -------------------------------------
                            INPUT DATA (JSON):
                            {JsonConvert.SerializeObject(structuredData, Formatting.Indented)}

                            -------------------------------------
                            OUTPUT FORMAT (STRICT JSON ONLY, NO MARKDOWN):

                            {{
                              ""feedback"": ""A detailed technical summary (4-6 sentences) describing flight phases, performance, stability, and overall behavior"",
                              ""details"": [
                                ""List of real issues OR confirmation of stable behavior"",
                                ""Avoid false positives (e.g., velocity=0 after landing)""
                              ],
                              ""riskLevel"": ""LOW | MEDIUM | HIGH""
                            }}
                            "
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

        var text = json["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString()
                   ?? throw new Exception("Empty AI response: " + result);

        text = text.Replace("```json", "").Replace("```", "").Trim();

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