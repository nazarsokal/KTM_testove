namespace KTM_testove.Contracts.Response;

public class EventResponse
{
    public string Type { get; set; }
    public double Timestamp { get; set; }
    public double[] Pos { get; set; }
}