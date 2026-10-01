/** Plain text of Markdown or HTML for schema answers and descriptions: what a reader sees, no markup. */
export function plainText(markup: string): string {
  return markup.replace(/<[^>]+>/g, ' ').replace(/[*_`#>]|\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();
}
