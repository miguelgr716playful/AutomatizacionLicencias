using AprovLicencias.Api.Configuration;
using AprovLicencias.Api.Services;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = FunctionsApplication.CreateBuilder(args);
builder.ConfigureFunctionsWebApplication();

builder.Services
    .AddApplicationInsightsTelemetryWorkerService()
    .ConfigureFunctionsApplicationInsights()
    .AddHttpClient()
    .AddSingleton<IAppSettingsProvider, AppSettingsProvider>()
    .AddSingleton<ISessionService, SessionService>()
    .AddSingleton<IUsersTableService, UsersTableService>()
    .AddSingleton<IAuthorizedUsersSeedService, AuthorizedUsersSeedService>()
    .AddSingleton<IBlobStorageService, BlobStorageService>()
    .AddSingleton<IKeyVaultService, KeyVaultService>()
    .AddSingleton<IAdobeUmapiService, AdobeUmapiService>();

builder.Build().Run();
