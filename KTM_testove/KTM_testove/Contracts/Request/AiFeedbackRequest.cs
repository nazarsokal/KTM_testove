namespace KTM_testove.Contracts.Request;

public class AiFeedbackRequest
{
    public required SummaryRequest SummaryRequest { get; set; }

    public required List<string> Events { get; set; }

    public required List<DataPointRequest> Points { get; set; }
}