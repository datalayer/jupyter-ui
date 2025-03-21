import { MessageHandler } from './messageHandler';

export async function fetch(
  request: RequestInfo,
  init?: RequestInit | null
): Promise<Response> {
  const r = new Request(request, init ?? undefined);
  const body = await r.text(); // FIXME this may not be always safe
  const headers: Record<string, string> = [...r.headers].reduce(
    (agg, pair) => ({ ...agg, [pair[0]]: pair[1] }),
    {}
  );
  const reply = await MessageHandler.instance.postRequest({
    type: 'http-request',
    body: {
      method: r.method,
      url: r.url,
      body,
      headers,
    },
  });
  {
    const { headers, body, status, statusText } = reply.body ?? {};
    return new Response(body, { headers, status, statusText });
  }
}
