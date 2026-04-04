using System.Text.Json.Serialization;

namespace KTM_testove.Contracts.Request;

public class DataPointRequest
{
    public double T { get; set; }
    public double[] Pos { get; set; }
    public double Vel { get; set; }
    public double[] Att { get; set; }
}

public class Vector3
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Z { get; set; }
}