import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
const client = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION ?? "us-east-1" });
const MODEL_EXPLAIN = process.env.MODEL_EXPLAIN ?? "us.amazon.nova-micro-v1:0";
const MODEL_REVIEW = process.env.MODEL_REVIEW ?? "us.anthropic.claude-haiku-4-5-20251001-v1:0";
const MAX_FILES = 10;
const ndjson = (o) => JSON.stringify(o) + "\n";
const decode = (b) => new TextDecoder().decode(b);
/* ── Amazon Nova Micro: 変更概要 (explain) ── */
// レスポンス全体: { output: { message: { role, content: [{ text }] } }, stopReason, usage: { inputTokens, outputTokens } }
async function invokeNova(diff) {
    const res = await client.send(new InvokeModelCommand({
        modelId: MODEL_EXPLAIN,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
            schemaVersion: "messages-v1",
            messages: [{
                role: "user", content: [{
                    text:
                        `このPRの差分をみてどのような変更が加えているかのみを出力して\n${diff}`
                }]
            }],
            inferenceConfig: { max_new_tokens: 4096 },
        }),
    }));
    const parsed = JSON.parse(decode(res.body));
    return parsed.output.message.content[0].text;
}
/* ── Claude 3.5 Sonnet: レビュー (review) ── */
// レスポンス全体: { id, model, type, role, content: [{ type, text }], stop_reason, usage: { input_tokens, output_tokens } }
async function invokeClaude(diff) {
    const res = await client.send(new InvokeModelCommand({
        modelId: MODEL_REVIEW,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 4096,
            messages: [{
                role: "user", content:
                    `このPRの差分を改善点や脆弱性についてP0, P1, P2で優先度をつけて出力して。ない場合はなしで大丈夫です\n${diff}`
            }],
        }),
    }));
    const parsed = JSON.parse(decode(res.body));
    return parsed.content[0].text;
}
/* ── Handler (RESPONSE_STREAM) ── */
export const handler = awslambda.streamifyResponse(
    async (event, responseStream, _ctx) => {
        const raw = typeof event.body === "string"
            ? JSON.parse(event.body) : event.body ?? {};
        const files = (raw.files ?? []).slice(0, MAX_FILES);
        const diff = files
            .map((f) => `--- ${f.filename} ---\n${f.patch}`)
            .join("\n\n");
        // 1. status チャンク
        responseStream.write(
            ndjson({ type: "status", body: "AIからのレスポンス待ち" })
        );
        // 2. 2モデルに非同期で投げ、完了次第 write
        const explainPromise = invokeNova(diff)
            .then((t) => responseStream.write(ndjson({ type: "explain", body: t })))
            .catch((e) => responseStream.write(ndjson({ type: "error", body: `[explain] ${e.message}` })));

        const reviewPromise = invokeClaude(diff)
            .then((t) => responseStream.write(ndjson({ type: "review", body: t })))
            .catch((e) => responseStream.write(ndjson({ type: "error", body: `[review] ${e.message}` })));
        await Promise.all([explainPromise, reviewPromise]);
        // 3. ストリーム終了
        responseStream.end();
    }
);