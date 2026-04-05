namespace KTM_testove.Contracts.Response;
using System.Text.Json.Serialization;
public class EventContract
{
    [JsonPropertyName("name")]
    public string Name { get; set; }

    [JsonPropertyName("t")]
    public double Time { get; set; }

    /// <summary>
    /// Масив [x, y, z]
    /// </summary>
    [JsonPropertyName("pos")]
    public double[] Position { get; set; }
}