using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Azure.WebJobs.Extensions.SignalRService;

namespace api
{
    public static class Messages
    {
        [FunctionName("createCode")]
        public static QuizIdOutput CreateGameCode([HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequest request)
        {
            return new QuizIdOutput { Id = Guid.NewGuid().ToString() };
        }

        [FunctionName("getDrift")]
        public static async Task<DriftModel> GetDrift([HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequest request)
        {            
            var body = await request.ReadAsStringAsync();

            var model = JsonConvert.DeserializeObject<DriftModel>(body);

            var clientStamp = model.ClientUtc;

            // Calculate drift.
            var diff = (DateTime.UtcNow - clientStamp).TotalMilliseconds;

            return new DriftModel
            {
                ClientUtc = clientStamp,
                KnownDriftMs = (int) diff
            };
        }

        [FunctionName("negotiate")]
        public static SignalRConnectionInfo GetSignalRInfo(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequest req,
            [SignalRConnectionInfo(HubName = "buzz")] SignalRConnectionInfo connectionInfo)
        {
            return connectionInfo;
        }

        [FunctionName("userBuzzed")]
        public static async Task Buzz(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequest request,
            [SignalR(HubName = "buzz")] IAsyncCollector<SignalRMessage> signalRMessages)
        {
            var body = await request.ReadAsStringAsync();

            var model = JsonConvert.DeserializeObject<InputModel>(body);

            var clientReportedTime = model.Timing.ClientUtc;

            var actualTime = clientReportedTime.AddMilliseconds(model.Timing.KnownDriftMs);
            
            await signalRMessages.AddAsync(new SignalRMessage
            {
                Target = "userBuzzed",
                Arguments = new object[] { model.User, actualTime }
            });
        }

        private class InputModel 
        {
            public string User { get; set; }

            public DriftModel Timing { get;set; }
        }

        public class QuizIdOutput 
        {
            public string Id { get; set;}
        }

        public class DriftModel
        {
            public DateTime ClientUtc { get; set; }

            public int KnownDriftMs { get; set; }
        }
    }
}
