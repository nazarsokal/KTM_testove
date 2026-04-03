namespace KTM_testove.Services.ServiceAbstractions;

public interface IParsingService
{
    public Task<string> Parse(IFormFile file);
}