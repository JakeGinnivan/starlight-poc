import { ImageFunction, defineCollection, z } from 'astro:content'
import { HeadConfigSchema } from '../starlight/schemas/head'
import { TableOfContentsSchema } from '../starlight/schemas/tableOfContents'

export const docTemplateSchema = z.enum(['doc', 'splash']).default('doc')
export const editUrlSchema = z
  .union([z.string().url(), z.boolean()])
  .optional()
  .default(true)

export const docsBaseSchema = z.object({
  /** The title of the current page. Required. */
  title: z.string(),

  /**
   * Set the layout style for this page.
   * Can be `'doc'` (the default) or `'splash'` for a wider layout without any sidebars.
   */
  template: docTemplateSchema,

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
  editUrl: editUrlSchema,

  /** Set custom `<head>` tags just for this page. */
  head: HeadConfigSchema(),

  /** Override global table of contents configuration for this page. */
  tableOfContents: TableOfContentsSchema().optional(),
})

const rfcSchema = ({}: { image: ImageFunction }) =>
  docsBaseSchema.merge(
    z.object({
      status: z.union([
        z.literal('proposed'),
        z.literal('rejected'),
        z.literal('accepted'),
        z.literal('deprecated'),
      ]),
    })
  )

export const collections = {
  rfcs: defineCollection({ schema: rfcSchema }),
  guides: defineCollection({ schema: docsBaseSchema }),
}

export type DocsBaseData = z.infer<typeof docsBaseSchema>
export type RfcData = z.infer<ReturnType<typeof rfcSchema>>
export type DocTemplates = z.infer<typeof docTemplateSchema>
