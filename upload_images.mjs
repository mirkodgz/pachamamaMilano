import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const IMAGES_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_IMAGES_TOKEN;
const IMAGES_HASH = process.env.CLOUDFLARE_IMAGES_HASH;

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const filesToUpload = [
    {
        name: 'ceviche',
        path: 'C:\\Users\\HP-LAPTOP\\.gemini\\antigravity\\brain\\8deb16b0-5ae9-415f-abca-1b96e66c6a1e\\ceviche_peru_demo_1773279741855.png',
        categories: ['CEVICHES', 'ENTRADAS']
    },
    {
        name: 'fondos',
        path: 'C:\\Users\\HP-LAPTOP\\.gemini\\antigravity\\brain\\8deb16b0-5ae9-415f-abca-1b96e66c6a1e\\lomo_saltado_demo_1773279756554.png',
        categories: ['FONDOS']
    },
    {
        name: 'makis',
        path: 'C:\\Users\\HP-LAPTOP\\.gemini\\antigravity\\brain\\8deb16b0-5ae9-415f-abca-1b96e66c6a1e\\maki_sushi_demo_1773279769201.png',
        categories: ['MAKIS (10 pz)']
    },
    {
        name: 'dolci',
        path: 'C:\\Users\\HP-LAPTOP\\.gemini\\antigravity\\brain\\8deb16b0-5ae9-415f-abca-1b96e66c6a1e\\torta_choco_demo_1773279802123.png',
        categories: ['DOLCI']
    },
    {
        name: 'bar_items',
        path: 'C:\\Users\\HP-LAPTOP\\.gemini\\antigravity\\brain\\8deb16b0-5ae9-415f-abca-1b96e66c6a1e\\pisco_sour_demo_1773279786933.png',
        categories: ['ALL_BAR']
    }
];

async function uploadToCloudflare(filePath) {
    const fileData = fs.readFileSync(filePath);
    const formData = new FormData();
    const blob = new Blob([fileData], { type: 'image/png' });
    formData.append('file', blob, path.basename(filePath));

    const headers = {};
    if (process.env.CLOUDFLARE_GLOBAL_KEY && process.env.CLOUDFLARE_EMAIL) {
        headers['X-Auth-Email'] = process.env.CLOUDFLARE_EMAIL;
        headers['X-Auth-Key'] = process.env.CLOUDFLARE_GLOBAL_KEY;
    } else {
        headers['Authorization'] = `Bearer ${IMAGES_TOKEN}`;
    }

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`, {
        method: 'POST',
        headers: headers,
        body: formData
    });

    const data = await response.json();
    if (!data.success) {
        throw new Error(data.errors?.[0]?.message || 'CF error');
    }
    return `https://imagedelivery.net/${IMAGES_HASH}/${data.result.id}/public`;
}

async function run() {
    for (const file of filesToUpload) {
        console.log(`Uploading ${file.name}...`);
        try {
            const url = await uploadToCloudflare(file.path);
            console.log(`URL: ${url}`);

            if (file.categories.includes('ALL_BAR')) {
                 console.log('Updating all bar items...');
                 await supabase.from('bar_items').update({ image_url: url }).neq('category_id', '00000000-0000-0000-0000-000000000000');
            } else {
                 const { data: cats } = await supabase.from('menu_categories').select('id, name');
                 const targetCats = cats.filter(c => file.categories.includes(c.name)).map(c => c.id);

                 for (const catId of targetCats) {
                      console.log(`Updating category ${catId}...`);
                      await supabase.from('menu_items').update({ image_url: url }).eq('category_id', catId);
                 }
            }
        } catch (e) {
            console.error(`Failed to upload ${file.name}:`, e);
            continue;
        }
    }
    console.log('Done.');
}
run();
