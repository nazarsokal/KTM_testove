using System.Text.Json.Serialization;

namespace KTM_testove.Contracts.Response;

public class ChartsResponse
{
    [JsonPropertyName("altitude_over_time")]
    public List<double[]> AltitudeOverTime { get; set; }

    [JsonPropertyName("velocity_over_time")]
    public List<double[]> VelocityOverTime { get; set; }

    public List<double[]> Acceleration { get; set; }
}