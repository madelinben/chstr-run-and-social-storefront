/** Scroll reveals with CSS transitions and one IntersectionObserver (no animation library on public pages). */
export function startScrollReveals() {
  if (!document.documentElement.classList.contains('motion')) return;

  const targets = document.querySelectorAll<HTMLElement>('[data-reveal], [data-panel-bars]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, order) => {
          const element = entry.target as HTMLElement;
          // Stagger siblings that enter together; panel bars stagger their own children.
          element.style.setProperty('--reveal-delay', `${order * 100}ms`);
          element.classList.add('revealed');
          observer.unobserve(element);
        });
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  targets.forEach((target) => observer.observe(target));
}
