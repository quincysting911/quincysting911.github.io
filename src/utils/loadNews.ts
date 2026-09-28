import fs from 'fs';
import path from 'path';
import { NewsData } from '@/types/content';

/** Build-time loader for the aggregated news store written by scripts/fetch-content.js. */
export async function loadNews(): Promise<NewsData> {
  const dataPath = path.join(process.cwd(), 'public/data/all.json');
  try {
    const { lastUpdated, totalItems, sources, items } = JSON.parse(await fs.promises.readFile(dataPath, 'utf-8'));
    return { lastUpdated, totalItems, sources, items };
  } catch (error) {
    console.error(`Could not read ${dataPath}:`, error);
    return { lastUpdated: new Date(0).toISOString(), totalItems: 0, items: [] };
  }
}
