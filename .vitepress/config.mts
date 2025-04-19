import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "My Awesome Project",
  description: "A VitePress Site",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/self-discovery' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Building Resilience', link: '/building-resilience' },
          { text: 'Finding Purpose', link: '/finding-purpose' },
          { text: 'Self-Discovery', link: '/self-discovery' },
          { text: 'Overcoming Challenges', link: '/overcoming-challenges' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
