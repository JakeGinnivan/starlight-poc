import type { docsSchema } from '@astrojs/starlight/schema'
import type { z } from 'astro:content'

export type StarlightData = z.infer<ReturnType<ReturnType<typeof docsSchema>>>
