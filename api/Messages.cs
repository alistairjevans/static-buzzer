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
            
            await signalRMessages.AddAsync(new SignalRMessage
            {
                Target = "userBuzzed",
                Arguments = new object[] { model.User, DateTime.UtcNow }
            });
        }

        private class InputModel 
        {
            public string User { get; set; }
        }
    }
}
