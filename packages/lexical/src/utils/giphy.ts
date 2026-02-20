/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Fetch a random GIF from Giphy's trending endpoint.
 *
 * Uses the `/trending` endpoint (more reliable rate limits) and picks
 * a random entry from the batch.
 *
 * @returns `{ altText, src }` or `null` if the fetch fails.
 */

const GIPHY_API_KEY = 'Gc7131jiJuvI7IdN0HZ1D7nh0ow5BU6g';
const GIPHY_TRENDING_URL = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=50&rating=g`;

export interface GiphyResult {
  altText: string;
  src: string;
}

export async function fetchRandomGif(): Promise<GiphyResult | null> {
  try {
    const res = await fetch(GIPHY_TRENDING_URL);
    const json = await res.json();
    const gifs = json?.data;
    if (!Array.isArray(gifs) || gifs.length === 0) {
      return null;
    }
    const gif = gifs[Math.floor(Math.random() * gifs.length)];
    const src =
      gif.images?.downsized_medium?.url ||
      gif.images?.original?.url ||
      gif.images?.fixed_height?.url;
    if (!src) {
      return null;
    }
    return {
      altText: gif.title || 'Random GIF',
      src,
    };
  } catch {
    return null;
  }
}
