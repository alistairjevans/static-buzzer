module.exports = async function (context, req, connectionInfo) {
    context.log('JavaScript HTTP trigger function processed a request.');
    context.res.json(connectionInfo);
};