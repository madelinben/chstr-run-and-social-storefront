const formatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

export function formatPounds(pence: number): string {
  return formatter.format(pence / 100);
}
