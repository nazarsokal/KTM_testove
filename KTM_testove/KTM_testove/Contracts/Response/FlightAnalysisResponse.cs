namespace KTM_testove.Contracts.Response;

public class FlightAnalysisResponse
{
    public required TrajectoryResponse Trajectory { get; set; }
    public required SummaryResponse Summary { get; set; }
    public required ChartsResponse Charts { get; set; }
    public required List<EventResponse> Events { get; set; }
}