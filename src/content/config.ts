import { ImageFunction, defineCollection, z } from 'astro:content'
import { HeadConfigSchema } from '../starlight/schemas/head'
import { TableOfContentsSchema } from '../starlight/schemas/tableOfContents'

const rfcSchema = ({ image }: { image: ImageFunction }) =>
  z.object({
    /** The title of the current page. Required. */
    title: z.string(),

    /**
     * A short description of the current page’s content. Optional, but recommended.
     * A good description is 150–160 characters long and outlines the key content
     * of the page in a clear and engaging way.
     */
    description: z.string().optional(),

    /**
     * Custom URL where a reader can edit this page.
     * Overrides the `editLink.baseUrl` global config if set.
     *
     * Can also be set to `false` to disable showing an edit link on this page.
     */
    editUrl: z.union([z.string().url(), z.boolean()]).optional().default(true),

    /** Set custom `<head>` tags just for this page. */
    head: HeadConfigSchema(),

    /** Override global table of contents configuration for this page. */
    tableOfContents: TableOfContentsSchema().optional(),
    status: z.union([
      z.literal('proposed'),
      z.literal('rejected'),
      z.literal('accepted'),
      z.literal('deprecated'),
    ]),
  })

export const collections = {
  rfcs: defineCollection({ schema: rfcSchema }),
}
