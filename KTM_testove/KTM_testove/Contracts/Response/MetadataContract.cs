namespace KTM_testove.Contracts.Response;
using System.Text.Json.Serialization;
public class MetadataContract
{
    [JsonPropertyName("mission_id")]
    public string MissionId { get; set; }

    [JsonPropertyName("vehicle_type")]
    public string VehicleType { get; set; }

    [JsonPropertyName("reference_wgs84")]
    public Wgs84Reference ReferenceWgs84 { get; set; }
}