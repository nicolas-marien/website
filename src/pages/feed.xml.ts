import rss, { type RSSFeedItem } from '@astrojs/rss';
import { type APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  let posts = await getCollection('blog');
  posts = posts.filter((p) => !p.data.draft);
  return rss({
    title: 'Nicolas Marien - Blog',
    // `<description>` field in output xml
    description: 'Some personal archives about software development. Maybe more.',
    // Pull in your project "site" from the endpoint context
    // https://docs.astro.build/en/reference/api-reference/#site
    site: context.site!,
    // Array of `<item>`s in output xml
    // See "Generating items" section for examples using content collections and glob imports
    items: posts.map<RSSFeedItem>((post) => {
      return {
        title: post.data.title,
        pubDate: new Date(post.data.published_at),
        description: post.data.abstract,
        // Compute RSS link from post `id`
        // This example assumes all posts are rendered as `/blog/[id]` routes
        link: `/posts/${post.id}/`,
      };
    }),
    customData: `<language>en-us</language>`,
  });
}
