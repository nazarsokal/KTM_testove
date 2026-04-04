using KTM_testove.Contracts.Request;
using KTM_testove.DTOs;

namespace KTM_testove.Services.ServiceAbstractions;

public interface IAiFeedbackService
{
    public Task<AiAnalysisDto> GetFeedbackAsync(AiFeedbackRequest request);
}