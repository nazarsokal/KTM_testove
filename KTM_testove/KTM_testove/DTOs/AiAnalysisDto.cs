namespace KTM_testove.DTOs;

public class AiAnalysisDto
{
    public required string Feedback { get; set; }
    
    public List<string>? Details { get; set; }
    
    public string? RiskLevel { get; set; }
}