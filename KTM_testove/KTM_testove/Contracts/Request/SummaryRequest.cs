using System.Text.Json.Serialization;

namespace KTM_testove.Contracts.Request;


public class SummaryRequest
{
    [JsonPropertyName("max_vertical_speed")]
    public double MaxVerticalSpeed { get; set; }

    [JsonPropertyName("max_horizontal_speed")]
    public double MaxHorizontalSpeed { get; set; }

    [JsonPropertyName("max_acceleration")]
    public double MaxAcceleration { get; set; }

    [JsonPropertyName("max_altitude")]
    public double MaxAltitude { get; set; }

    [JsonPropertyName("total_distance")]
    public double TotalDistance { get; set; }

    [JsonPropertyName("duration_seconds")]
    public double DurationSeconds { get; set; }
}