import { MessageHandler } from './messageHandler';

export async function fetch(
  request: RequestInfo,
  init?: RequestInit | null
): Promise<Response> {
  const reply = await MessageHandler.instance.postRequest({
    type: 'http',
    body: {
      request,
      init,
    },
  });

  return reply.body;
}
