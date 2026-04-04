namespace KTM_testove.Services.ServiceAbstractions;
using KTM_testove.Contracts.Response;
public interface IParsingService
{
    public Task<MissionResponse> Parse(IFormFile file);
}