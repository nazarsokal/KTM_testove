namespace KTM_testove.Contracts.Response;
using System.Text.Json.Serialization;
using System.Collections.Generic;
public class MissionResponse
{
    [JsonPropertyName("metadata")]
    public MetadataContract Metadata { get; set; }

    [JsonPropertyName("summary")]
    public SummaryContract Summary { get; set; }

    [JsonPropertyName("events")]
    public List<EventContract> Events { get; set; }

    /// <summary>
    /// Використовуємо List або IReadOnlyList для великих масивів точок
    /// </summary>
    [JsonPropertyName("trajectory")]
    public List<TrajectoryPointContract> Trajectory { get; set; }
}