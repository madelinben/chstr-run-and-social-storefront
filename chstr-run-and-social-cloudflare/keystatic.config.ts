import { collection, config, fields } from '@keystatic/core';

// Every save is a GitHub commit to main, which triggers a Pages/Workers rebuild.
// Keystatic's local-file mode needs Node and does not run in the workerd dev runtime (Astro 7 + adapter 14).
export default config({
  storage: { kind: 'github', repo: 'madelinben/chstr-run-and-social-cloudflare' },
  collections: {
    products: collection({
      label: 'Products',
      slugField: 'name',
      path: 'src/content/products/*',
      format: { contentField: 'description' },
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        pricePence: fields.integer({ label: 'Price in pence (2000 = £20)', validation: { min: 1 } }),
        sizes: fields.array(fields.text({ label: 'Size' }), { label: 'Sizes', itemLabel: (props) => props.value }),
        images: fields.array(fields.text({ label: 'Image path, e.g. /images/tee.jpg' }), { label: 'Images', itemLabel: (props) => props.value }),
        published: fields.checkbox({ label: 'Published', defaultValue: false }),
        description: fields.markdoc({ label: 'Description', extension: 'md' }),
      },
    }),
    faqs: collection({
      label: 'FAQs',
      slugField: 'question',
      path: 'src/content/faqs/*',
      format: { contentField: 'answer' },
      schema: {
        question: fields.slug({ name: { label: 'Question' } }),
        position: fields.integer({ label: 'Order (1 = first)', validation: { min: 1 } }),
        answer: fields.markdoc({ label: 'Answer', extension: 'md' }),
      },
    }),
  },
});
