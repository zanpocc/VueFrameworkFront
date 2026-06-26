import { describe, expect, it } from 'vitest';
import { parseEventStream } from '@/api/realtime';

function streamFromText(text: string) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

describe('parseEventStream', () => {
  it('parses event name, id and json data', async () => {
    const frames: Array<{ id?: string; event?: string; data: string }> = [];

    await parseEventStream(
      streamFromText('id: notice-1\nevent: notice.published\ndata: {"id":"notice-1"}\n\n'),
      (frame) => frames.push(frame),
    );

    expect(frames).toEqual([
      {
        id: 'notice-1',
        event: 'notice.published',
        data: '{"id":"notice-1"}',
      },
    ]);
  });
});
