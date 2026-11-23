import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** Published posts, newest first. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', (p) => !p.data.draft);
  return posts.sort(
    (a, b) =>
      new Date(b.data.published_at!).getTime() - new Date(a.data.published_at!).getTime(),
  );
}

const longDate = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' });
const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

export const formatDate = (date: string) => longDate.format(new Date(date));
export const formatMonth = (date: string) => monthYear.format(new Date(date));

export function readingMinutes(body = ''): number {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220));
}
