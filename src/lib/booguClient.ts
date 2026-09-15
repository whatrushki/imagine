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

// Intercept browser fetch calls to fix Gradio Client CORS errors on Hugging Face Spaces:
// 1. Gradio client defaults to `credentials: 'include'`. Hugging Face Space servers do not
//    return `Access-Control-Allow-Credentials: true` in OPTIONS preflight responses, causing
//    Chromium to reject cross-origin requests with a CORS error on https://whatrushki.github.io/.
//    Switching credentials to 'omit' resolves this for all HF endpoints.
// 2. Gradio client attaches `Content-Type: application/json` to GET /config, forcing an unnecessary
//    preflight. Stripping Content-Type on GET requests prevents this preflight entirely.
if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input && typeof (input as Request).url === 'string') {
      url = (input as Request).url;
    }

    const isHfOrBoogu =
      url.includes('hf.space') ||
      url.includes('huggingface.co') ||
      url.includes('boogu.org');

    if (isHfOrBoogu) {
      const opts: RequestInit = init ? { ...init } : {};

      if (opts.credentials === 'include') {
        opts.credentials = 'omit';
      }

      const method = (opts.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
      if (method === 'GET' && opts.headers) {
        if (opts.headers instanceof Headers) {
          opts.headers.delete('content-type');
        } else if (Array.isArray(opts.headers)) {
          opts.headers = opts.headers.filter(([k]) => k.toLowerCase() !== 'content-type');
        } else if (typeof opts.headers === 'object') {
          delete (opts.headers as Record<string, string>)['content-type'];
          delete (opts.headers as Record<string, string>)['Content-Type'];
        }
      }

      if (input instanceof Request) {
        const reqInit: RequestInit = {
          credentials: 'omit',
        };
        if (method === 'GET') {
          const headers = new Headers(input.headers);
          headers.delete('content-type');
          reqInit.headers = headers;
        }
        input = new Request(input, reqInit);
      }

      return origFetch(input, opts);
    }

    return origFetch(input, init);
  };
}

// Backend endpoints for Boogu-Image-0.1-Edit-Turbo:
// 1. multimodalart/Boogu-Image: active, official ZeroGPU space on Hugging Face
// 2. Guaryn/Boogu-Image: running backup ZeroGPU space on Hugging Face
// 3. demo-edit-turbo-1k.boogu.org: official boogu demo (used when up)
// 4. demo-edit-turbo-1k5.boogu.org: alternative official demo
export const SERVERS = [
  'multimodalart/Boogu-Image',
  'Guaryn/Boogu-Image',
  'https://demo-edit-turbo-1k.boogu.org/',
  'https://demo-edit-turbo-1k5.boogu.org/',
];

export let SERVER_URL = SERVERS[0];

export function setServerUrl(url: string): void {
  SERVER_URL = url;
  resetAllGradioClients();
}

interface ClientInstance {
  client: any;
  server: string;
}

// Connection pool per parallel worker thread
const clientPool = new Map<number, ClientInstance>();

export function resetGradioClient(workerId = 0): void {
  clientPool.delete(workerId);
}

export function resetAllGradioClients(): void {
  clientPool.clear();
}

/**
 * Connects to a working Gradio backend with auto-failover
 */
export async function getGradioClient(workerId = 0): Promise<ClientInstance> {
  const cached = clientPool.get(workerId);
  if (cached) {
    return cached;
  }

  // Try current SERVER_URL first, then try the other servers in SERVERS list
  const tryServers = [SERVER_URL, ...SERVERS.filter((s) => s !== SERVER_URL)];
  let lastError: any = null;

  for (const srv of tryServers) {
    try {
      console.log(`[Worker ${workerId}] Connecting to Boogu backend: ${srv}...`);
      const client = await Client.connect(srv);

      // If connecting to official boogu endpoint, sync 1.5K choices
      if (srv.includes('boogu.org')) {
        try {
          await client.predict('/update_res_choices', ['1.5K']);
        } catch {}
      }

      SERVER_URL = srv;
      const instance: ClientInstance = { client, server: srv };
      clientPool.set(workerId, instance);
      console.log(`[Worker ${workerId}] Connected successfully to: ${srv}`);
      return instance;
    } catch (err: any) {
      console.warn(`[Worker ${workerId}] Failed to connect to ${srv}:`, err?.message || err);
      lastError = err;
    }
  }

  throw new Error(
    `Сервер генерации временно недоступен (${lastError?.message || '502 Bad Gateway'}). Идет переподключение...`
  );
}

/**
 * Robustly extracts the result image URL from diverse Gradio response shapes
 */
function extractImageUrl(data: any): string {
  if (!data) return '';

  const items = Array.isArray(data) ? data : [data];

  for (const item of items) {
    if (!item) continue;
    if (
      typeof item === 'string' &&
      (item.startsWith('http://') ||
        item.startsWith('https://') ||
        item.startsWith('blob:') ||
        item.startsWith('data:'))
    ) {
      return item;
    }
    if (typeof item === 'object') {
      if (typeof item.url === 'string' && item.url) {
        return item.url;
      }
      if (item.image && typeof item.image.url === 'string') {
        return item.image.url;
      }
      if (typeof item.path === 'string' && (item.path.startsWith('http://') || item.path.startsWith('https://'))) {
        return item.path;
      }
      if (item instanceof Blob) {
        return URL.createObjectURL(item);
      }
    }
  }

  return '';
}

export async function generateImage(
  file: File | Blob | null | undefined,
  instruction: string,
  resolution = '1536x1536 ( 1:1 )',
  seed = 42,
  thinking = false,
  workerId = 0
): Promise<{ resultUrl: string; duration: number }> {
  const instance = await getGradioClient(workerId);
  const { width, height } = parseResDims(resolution);
  const t0 = performance.now();

  try {
    let response: any;

    if (instance.server.includes('Boogu-Image')) {
      // Endpoint on Hugging Face ZeroGPU space: /edit (handles both text-to-image and image-to-image)
      const is2K =
        resolution.includes('2K') ||
        resolution.includes('2048') ||
        resolution.includes('1856') ||
        resolution.includes('1744');

      response = await instance.client.predict('/edit', {
        image: file || null,
        instruction: instruction,
        model_choice: 'Turbo',
        resolution: is2K ? '2K' : '1K',
        num_inference_steps: 4,
        text_guidance_scale: 4,
        image_guidance_scale: 1,
        seed: seed,
        randomize_seed: false,
      });
    } else {
      // Endpoint on official demo-edit-turbo-1k.boogu.org: /infer
      response = await instance.client.predict('/infer', {
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
    }

    const duration = (performance.now() - t0) / 1000;
    const finalUrl = extractImageUrl(response.data);

    if (!finalUrl) {
      throw new Error('Сервер не вернул изображение.');
    }

    return { resultUrl: finalUrl, duration };
  } catch (err: any) {
    console.error(`[Worker ${workerId}] Generation failed on ${instance.server}:`, err);
    resetGradioClient(workerId);
    // If the error was a server disconnect or 502, rotate SERVER_URL to the next candidate
    const nextServer = SERVERS.find((s) => s !== instance.server);
    if (nextServer) {
      SERVER_URL = nextServer;
    }
    throw err;
  }
}
