import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    pricePence: z.number().int().positive(),
    sizes: z.array(z.string()).min(1),
    images: z.array(z.string()).min(1),
    published: z.boolean(),
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faqs' }),
  schema: z.object({
    question: z.string(),
    position: z.number().int(),
  }),
});

export const collections = { products, faqs };
