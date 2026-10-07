// Lighthouse CI: lab Core Web Vitals and category scores on the BUILT site (mobile profile, simulated slow 4G), run in CI.
// Thresholds mirror .cursor/rules/performance.mdc. A drop below them fails the pipeline.
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      // Representative templates: home (hero collage), a content page, the shop, a product, and the new pages.
      url: ['/index.html', '/events/index.html', '/gallery/index.html', '/faqs/index.html', '/merchandise/index.html', '/merchandise/jumper/index.html'],
      numberOfRuns: 2,
      settings: { chromeFlags: '--no-sandbox --headless=new' },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
        'uses-responsive-images': 'warn',
        'unsized-images': 'error',
        'meta-description': 'error',
        'document-title': 'error',
        canonical: 'error',
        'is-crawlable': 'error',
        'image-alt': 'error',
        'heading-order': 'error',
        'link-name': 'error',
        'color-contrast': 'error',
        'target-size': 'error',
        viewport: 'error',
        'is-on-https': 'off',
      },
    },
    upload: { target: 'filesystem', outputDir: './.lighthouseci' },
  },
};
