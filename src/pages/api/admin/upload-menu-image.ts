import type { APIRoute } from 'astro';

const ACCOUNT_ID = import.meta.env.CLOUDFLARE_ACCOUNT_ID;
const IMAGES_TOKEN = import.meta.env.CLOUDFLARE_API_TOKEN || import.meta.env.CLOUDFLARE_IMAGES_TOKEN;
const IMAGES_HASH = import.meta.env.CLOUDFLARE_IMAGES_HASH;

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!ACCOUNT_ID || !IMAGES_TOKEN || !IMAGES_HASH) {
        throw new Error('Configurazione Cloudflare incompleta nel file .env');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'File mancante' }), { status: 400 });
    }

    const cfFormData = new FormData();
    cfFormData.append('file', file);

    const headers: Record<string, string> = {};
    if (import.meta.env.CLOUDFLARE_GLOBAL_KEY && import.meta.env.CLOUDFLARE_EMAIL) {
        headers['X-Auth-Email'] = import.meta.env.CLOUDFLARE_EMAIL;
        headers['X-Auth-Key'] = import.meta.env.CLOUDFLARE_GLOBAL_KEY;
    } else {
        headers['Authorization'] = `Bearer ${IMAGES_TOKEN}`;
    }

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: headers,
        body: cfFormData
      }
    );

    const cfResult = await cfResponse.json();

    if (!cfResult.success) {
      throw new Error(cfResult.errors?.[0]?.message || 'Errore durante il caricamento su Cloudflare Images');
    }

    const imageId = cfResult.result.id;
    const publicUrl = `https://imagedelivery.net/${IMAGES_HASH}/${imageId}/public`;

    return new Response(JSON.stringify({ success: true, url: publicUrl }), { status: 200 });
  } catch (error: any) {
    console.error('Upload Error Cloudflare Images:', error);
    return new Response(JSON.stringify({ error: error.message || 'Errore durante il caricamento' }), { status: 500 });
  }
};
