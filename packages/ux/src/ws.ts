export const connect = (address: string, retry: boolean) => {
  const ws = new WebSocket(address);
  ws.onerror = (event: Event) => {
    console.log('---', event);
  }
  ws.onmessage = (message: MessageEvent) => {
    console.log('---', message);
  }
  ws.onopen = (event: Event) => {
    console.log('---', event);
    ws.send('ping');
  }
}

export default connect;
