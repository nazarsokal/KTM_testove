using KTM_testove.Services;
using KTM_testove.Services.ServiceAbstractions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "https://ktm-testove.vercel.app/",
                "https://vercel.com/nazarsokals-projects/ktm-testove/rbdaaXaHN8LubhperB3nnd6BVs5v",
                "http://localhost:5173", // Залишаємо для локального Vite
                "http://localhost:3000"  // На всякий випадок для локальних тестів
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
// Add services to the container.

builder.Services.AddControllers();
DotNetEnv.Env.Load();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<IParsingService, ParsingService>();
builder.Services.AddHttpClient<IAiFeedbackService, AiFeedbackService>();
var app = builder.Build();
app.UseCors("AllowAll");
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
