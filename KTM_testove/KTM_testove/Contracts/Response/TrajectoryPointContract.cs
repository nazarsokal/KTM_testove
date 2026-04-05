namespace KTM_testove.Contracts.Response;
using System.Text.Json.Serialization;
public class TrajectoryPointContract
{
    [JsonPropertyName("t")]
    public double Time { get; set; }

    /// <summary>
    /// Масив [x, y, z]
    /// </summary>
    [JsonPropertyName("pos")]
    public double[] Position { get; set; }

    [JsonPropertyName("vel")]
    public double Velocity { get; set; }

    /// <summary>
    /// Масив [roll, pitch, yaw]
    /// </summary>
    [JsonPropertyName("att")]
    public double[] Attitude { get; set; }
}