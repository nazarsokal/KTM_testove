namespace KTM_testove.Contracts.Response;

public class TrajectoryPointResponse
{
    public required double[] Pos { get; set; } // [x, y, z]
    public double Speed { get; set; }
    public double T { get; set; }
}