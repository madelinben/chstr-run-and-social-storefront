import { expect, it } from 'vitest';
import { plainText } from '@/utilities/plain-text';

it('strips markup', () => {
  expect(plainText('**Bold** and [a link](https://x.test) <b>tag</b>\n\nnext')).toBe('Bold and a link tag next');
});
