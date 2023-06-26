import mdx from '@astrojs/mdx'
import type { AstroConfig, AstroIntegration, AstroUserConfig } from 'astro'
import { ViteUserConfig, defineConfig } from 'astro/config'
import { spawn } from 'node:child_process'
import { dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { starlightAsides } from './src/starlight/integrations/asides'
import { starlightSitemap } from './src/starlight/integrations/sitemap'
import { errorMap } from './src/starlight/utils/error-map'
import {
  StarlightConfig,
  StarlightConfigSchema,
  StarlightUserConfig,
} from './src/starlight/utils/user-config'

// https://astro.build/config
export default defineConfig({
  integrations: [
    knowledgeBaseIntegration({
      title: 'My Docs',
      social: {
        github: 'https://github.com/withastro/starlight',
      },

      sidebar: [
        {
          label: 'Guides',
          items: [
            // Each item here is one entry in the navigation menu.
            { label: 'Example Guide', link: '/example/' },
          ],
        },
        {
          label: 'Reference',
          autogenerate: { directory: '/docs/reference' },
        },
        {
          label: "RFC's",
          autogenerate: { directory: 'rfcs' },
        },
        {
          label: 'Decisions',
          autogenerate: { directory: 'decision-records' },
        },
      ],
    }),
  ],

  // Process images with sharp: https://docs.astro.build/en/guides/assets/#using-sharp
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
})

export function knowledgeBaseIntegration(opts: StarlightUserConfig) {
  const parsedConfig = StarlightConfigSchema.safeParse(opts, { errorMap })

  if (!parsedConfig.success) {
    throw new Error(
      'Invalid config passed to starlight integration\n' +
        parsedConfig.error.issues.map((i) => i.message).join('\n')
    )
  }

  const userConfig = parsedConfig.data

  const Starlight: AstroIntegration = {
    name: '@astrojs/starlight',
    hooks: {
      'astro:config:setup': ({ config, injectRoute, updateConfig }) => {
        injectRoute({
          pattern: '404',
          entryPoint: '@astrojs/starlight/404.astro',
        })
        const newConfig: AstroUserConfig = {
          vite: {
            plugins: [vitePluginStarlightUserConfig(userConfig, config)],
          },
          markdown: {
            remarkPlugins: [...starlightAsides()],
            shikiConfig:
              // Configure Shiki theme if the user is using the default github-dark theme.
              config.markdown.shikiConfig.theme !== 'github-dark'
                ? {}
                : { theme: 'css-variables' },
          },
          experimental: { assets: true, inlineStylesheets: 'auto' },
        }
        updateConfig(newConfig)
      },

      'astro:build:done': ({ dir }) => {
        const targetDir = fileURLToPath(dir)
        const cwd = dirname(fileURLToPath(import.meta.url))
        const relativeDir = relative(cwd, targetDir)
        return new Promise<void>((resolve) => {
          spawn('npx', ['-y', 'pagefind', '--source', relativeDir], {
            stdio: 'inherit',
            shell: true,
            cwd,
          }).on('close', () => resolve())
        })
      },
    },
  }

  return [starlightSitemap(userConfig), Starlight, mdx()]
}

/** Expose the Starlight user config object via a virtual module. */
function vitePluginStarlightUserConfig(
  opts: StarlightConfig,
  { root }: AstroConfig
): NonNullable<ViteUserConfig['plugins']>[number] {
  const modules = {
    'virtual:starlight/user-config': `export default ${JSON.stringify(opts)}`,
    'virtual:starlight/project-context': `export default ${JSON.stringify({
      root,
    })}`,
    'virtual:starlight/user-css': opts.customCss
      .map((id) => `import "${id}";`)
      .join(''),
    'virtual:starlight/user-images': opts.logo
      ? 'src' in opts.logo
        ? `import src from "${opts.logo.src}"; export const logos = { dark: src, light: src };`
        : `import dark from "${opts.logo.dark}"; import light from "${opts.logo.light}"; export const logos = { dark, light };`
      : 'export const logos = {};',
  }
  const resolutionMap = Object.fromEntries(
    (Object.keys(modules) as (keyof typeof modules)[]).map((key) => [
      resolveVirtualModuleId(key),
      key,
    ])
  )

  return {
    name: 'vite-plugin-starlight-user-config',
    resolveId(id): string | void {
      if (id in modules) return resolveVirtualModuleId(id)
    },
    load(id): string | void {
      const resolution = resolutionMap[id]
      if (resolution) return modules[resolution]
    },
  }
}

function resolveVirtualModuleId(id: string) {
  return '\0' + id
}
