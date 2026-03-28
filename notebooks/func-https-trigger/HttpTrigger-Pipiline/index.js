const https = require('https');

function post(path, token, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const r = https.request({
            hostname: 'management.azure.com',
            path, method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        }, res => { let out = ''; res.on('data', d => out += d); res.on('end', () => resolve(JSON.parse(out))); });
        r.on('error', reject);
        r.write(data);
        r.end();
    });
}

module.exports = async function(context, req) {
    const team_id = req.query.team_id;
    if (!team_id) return context.res = { status: 400, body: "Missing team_id" };

    const result = await post(
        `/subscriptions/${process.env.SUB}/resourceGroups/${process.env.RG}/providers/Microsoft.DataFactory/factories/${process.env.ADF}/pipelines/copy-teams/createRun?api-version=2018-06-01`,
        process.env.BEARER_TOKEN,
        { team_id }
    );

    const ok = !!result.runId;
    context.log(ok ? `started runId: ${result.runId}` : `failed: ${JSON.stringify(result)}`);
    context.res = { body: ok ? { status: "started", team_id, runId: result.runId } : { error: result } };
};