const AWSXRay = require('aws-xray-sdk-core');
AWSXRay.captureHTTPsGlobal(require('http'));
AWSXRay.captureHTTPsGlobal(require('https'));

const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const ddb = new AWS.DynamoDB.DocumentClient();
const { TABLE_NAME = '', TARGET_URL = '' } = process.env;

exports.handler = async () => {
    const segment = AWSXRay.getSegment(); // root segment (facade in Lambda)
    if (segment) {
        segment.addAnnotation('route', '/hit');
        segment.addAnnotation('targetHost', new URL(TARGET_URL).host);
    }

    // 1) outbound HTTP (captured by X-Ray via captureHTTPsGlobal)
    const httpStart = Date.now();
    const resp = await fetch(TARGET_URL, { timeout: 8000 });
    const payload = await resp.json();
    const httpMs = Date.now() - httpStart;

    // 2) DynamoDB (captured by X-Ray via captureAWS)
    const id = uuidv4();
    const dbStart = Date.now();
    await ddb.put({
        TableName: TABLE_NAME,
        Item: { id, ts: new Date().toISOString(), source: TARGET_URL, payload }
    }).promise();
    const dbMs = Date.now() - dbStart;

    const totalMs = httpMs + dbMs;
    if (segment) segment.addMetadata('timings', { httpMs, dbMs, totalMs });

    return {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, httpMs, dbMs, totalMs, ok: true })
    };
};
