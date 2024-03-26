export async function consumeReadableStream(
    stream: ReadableStream<Uint8Array>,
    callback: (chunk: string) => void
): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            if (value) {
                callback(decoder.decode(value, { stream: true }));
            }
        }
    } catch (error) {
        console.error('Error consuming stream:', error);
    } finally {
        reader.releaseLock();
    }
}
