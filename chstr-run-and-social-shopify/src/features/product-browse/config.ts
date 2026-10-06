/** Club apparel size chart (from the supplier's guide). Chest is the measurement range in inches; UK is the dress-size equivalent. */
export const sizeGuide = [
  { size: 'XS', chest: '35"–37"', uk: '6/8' },
  { size: 'S', chest: '37"–39"', uk: '8/10' },
  { size: 'M', chest: '39"–41"', uk: '10/12' },
  { size: 'L', chest: '41"–43"', uk: '14/16' },
  { size: 'XL', chest: '43"–45"', uk: '16/18' },
  { size: '2XL', chest: '45"–48"', uk: '18/20' },
  { size: '3XL', chest: '48"–50"', uk: '' },
  { size: '4XL', chest: '51"–53"', uk: '' },
] as const;
