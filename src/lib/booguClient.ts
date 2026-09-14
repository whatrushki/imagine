import { Client } from '@gradio/client';
import { parseResDims } from './utils';

export const RESOLUTIONS_1_5K = [
  '1536x1536 ( 1:1 )',
  '1264x1856 ( 2:3 )',
  '1856x1264 ( 3:2 )',
  '1344x1744 ( 3:4 )',
  '1744x1344 ( 4:3 )',
  '1392x1696 ( 4:5 )',
  '1696x1392 ( 5:4 )',
  '1152x2032 ( 9:16 )',
  '2032x1152 ( 16:9 )',
  '2368x992 ( 21:9 )',
];

export const SERVER_URL = 'https://demo-edit-turbo-1k.boogu.org/';

// Separate connection pool per parallel worker thread
const clientPool = new Map<number, any>();

export function resetGradioClient(workerId = 0): void {
  clientPool.delete(workerId);
}

export function resetAllGradioClients(): void {
  clientPool.clear();
}

export async function getGradioClient(workerId = 0): Promise<any> {
  let client = clientPool.get(workerId);
  if (!client) {
    // Each worker connects with its own distinct session and WebSocket connection
    client = await Client.connect(SERVER_URL);
    try {
      await client.predict('/update_res_choices', ['1.5K']);
    } catch (e) {
      console.warn(`[Worker ${workerId}] 1.5K choices sync:`, e);
    }
    clientPool.set(workerId, client);
  }
  return client;
}

export async function generateImage(
  file: File,
  instruction: string,
  resolution = '1536x1536 ( 1:1 )',
  seed = 42,
  thinking = false,
  workerId = 0
): Promise<{ resultUrl: string; duration: number }> {
  const client = await getGradioClient(workerId);
  const { width, height } = parseResDims(resolution);

  const t0 = performance.now();

  const response = await client.predict('/infer', {
    instruction,
    reference_image: file,
    negative_instruction: '',
    seed: seed,
    randomize_seed: false,
    enable_pe: thinking,
    resolution_category: '1.5K',
    resolution_mode: 'Recommended resolutions',
    resolution: resolution,
    custom_width: width,
    custom_height: height,
    num_inference_steps: 4,
  });

  const duration = (performance.now() - t0) / 1000;

  // The result from gradio client in browser is an array: [ImageData, seed, instruction]
  // ImageData can be { url: string } or a Blob
  const data = response.data;
  let finalUrl = '';

  if (data && data[0]) {
    const item = data[0];
    if (typeof item === 'string') {
      finalUrl = item;
    } else if (item.url) {
      finalUrl = item.url;
    } else if (item instanceof Blob) {
      finalUrl = URL.createObjectURL(item);
    }
  }

  if (!finalUrl) {
    throw new Error('Сервер не вернул изображение.');
  }

  return { resultUrl: finalUrl, duration };
}
