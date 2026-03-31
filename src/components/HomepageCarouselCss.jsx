const HOMEPAGE_CAROUSEL_EXPERIMENTAL_CSS = `
.category-products-css-carousel::scroll-button(*) {
  position: absolute;
  position-anchor: --category-products-shell;
  top: 0.125rem;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid color-mix(in oklab, var(--color-primary) 15%, white);
  border-radius: 0.5rem;
  background: color-mix(in oklab, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  box-shadow: none;
  cursor: pointer;
  font-size: 1.45rem;
  line-height: 1;
  transition:
    transform 300ms,
    background-color 300ms,
    color 300ms,
    box-shadow 300ms,
    opacity 300ms;
}

.category-products-css-carousel::scroll-button(*):hover,
.category-products-css-carousel::scroll-button(*):focus-visible {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  box-shadow: 0 14px 34px rgba(10, 61, 46, 0.14);
}

.category-products-css-carousel::scroll-button(*):active {
  transform: scale(0.96);
}

.category-products-css-carousel::scroll-button(*):disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.category-products-css-carousel::scroll-button(left) {
  content: "‹" / "Previous products";
  right: 3rem;
}

.category-products-css-carousel::scroll-button(right) {
  content: "›" / "Next products";
  right: 0;
}
`;

export default function HomepageCarouselCss() {
  return <style dangerouslySetInnerHTML={{ __html: HOMEPAGE_CAROUSEL_EXPERIMENTAL_CSS }} />;
}
