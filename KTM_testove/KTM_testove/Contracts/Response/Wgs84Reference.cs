namespace KTM_testove.Contracts.Response;
using System.Text.Json.Serialization;
public class Wgs84Reference
{
    [JsonPropertyName("lat")]
    public double Latitude { get; set; }

    [JsonPropertyName("lon")]
    public double Longitude { get; set; }

    [JsonPropertyName("alt")]
    public double Altitude { get; set; }
}