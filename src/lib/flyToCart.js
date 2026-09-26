/**
 * One short flight from the product image to the cart icon.
 * Transform and opacity only. No rotation, and no flight until the cart is on screen.
 */

const FLIGHT_MS = 460;
const TARGET_WAIT_MS = 320;

let activeFlyer = null;
let activeAnimation = null;

function cartTarget() {
  return (
    document.querySelector('#nav-cart-button') ||
    document.querySelector('[data-cart-target]') ||
    document.querySelector('.nav-cart-button')
  );
}

function isOnScreen(rect) {
  return rect.width > 0 && rect.height > 0 && rect.bottom > 8 && rect.top < window.innerHeight - 8;
}

function waitForCartTarget() {
  return new Promise((resolve) => {
    const started = performance.now();

    function tick() {
      const target = cartTarget();
      if (target && isOnScreen(target.getBoundingClientRect())) {
        resolve(target);
        return;
      }
      if (performance.now() - started >= TARGET_WAIT_MS) {
        resolve(null);
        return;
      }
      window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
  });
}

function visibleProductImage(sourceEl) {
  const root = sourceEl.closest('article, li, a') || sourceEl.parentElement;
  const image = root?.querySelector?.('img');
  if (!image) return null;
  if (!isOnScreen(image.getBoundingClientRect())) return null;
  return image;
}

function removeFlyer(flyer) {
  if (flyer?.parentNode) {
    flyer.parentNode.removeChild(flyer);
  }
  if (activeFlyer === flyer) {
    activeFlyer = null;
    activeAnimation = null;
  }
}

function clearActiveFlight() {
  const flyer = activeFlyer;
  const animation = activeAnimation;
  activeFlyer = null;
  activeAnimation = null;
  if (animation) animation.cancel();
  removeFlyer(flyer);
}

function pointOnArc(t, start, control, end) {
  const inverse = 1 - t;
  return inverse * inverse * start + 2 * inverse * t * control + t * t * end;
}

function buildFrames(startX, startY, targetX, targetY) {
  const controlX = (startX + targetX) / 2;
  const controlY = Math.min(startY, targetY) - Math.min(72, Math.hypot(targetX - startX, targetY - startY) * 0.18);
  const frames = [];

  for (let step = 0; step <= 8; step += 1) {
    const progress = step / 8;
    const eased = 1 - (1 - progress) ** 3;
    const x = pointOnArc(eased, startX, controlX, targetX);
    const y = pointOnArc(eased, startY, controlY, targetY);
    const scale = 1 - eased * 0.62;
    const opacity = progress < 0.72 ? 1 : 1 - (progress - 0.72) / 0.28;

    frames.push({
      transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
      opacity,
    });
  }

  return frames;
}

export async function flyToCart({ sourceEl, imageSrc = '' } = {}) {
  if (typeof window === 'undefined' || !sourceEl) return;

  window.dispatchEvent(new CustomEvent('reveal-navbar'));

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (reducedMotion) {
    window.dispatchEvent(new CustomEvent('cart-item-landed'));
    return;
  }

  const sourceRect = sourceEl.getBoundingClientRect();
  if (sourceRect.width === 0 && sourceRect.height === 0) {
    window.dispatchEvent(new CustomEvent('cart-item-landed'));
    return;
  }

  const target = await waitForCartTarget();
  if (!target || !sourceEl.isConnected) {
    window.dispatchEvent(new CustomEvent('cart-item-landed'));
    return;
  }

  clearActiveFlight();

  const productImage = visibleProductImage(sourceEl);
  const origin = productImage ? productImage.getBoundingClientRect() : sourceRect;
  const size = 56;
  const startX = origin.left + origin.width / 2 - size / 2;
  const startY = origin.top + origin.height / 2 - size / 2;
  const targetRect = target.getBoundingClientRect();
  const targetX = targetRect.left + targetRect.width / 2 - size / 2;
  const targetY = targetRect.top + targetRect.height / 2 - size / 2;

  const flyer = document.createElement('div');
  flyer.style.position = 'fixed';
  flyer.style.top = '0';
  flyer.style.left = '0';
  flyer.style.width = `${size}px`;
  flyer.style.height = `${size}px`;
  flyer.style.borderRadius = '12px';
  flyer.style.overflow = 'hidden';
  flyer.style.pointerEvents = 'none';
  flyer.style.zIndex = '80';
  flyer.style.backgroundColor = '#fff';
  flyer.style.boxShadow = '0 8px 20px rgba(15, 23, 42, 0.16)';

  const picture = productImage ? productImage.cloneNode(false) : document.createElement('img');
  const src = productImage?.currentSrc || productImage?.src || imageSrc;
  if (src) {
    picture.src = src;
    picture.alt = '';
    picture.style.width = '100%';
    picture.style.height = '100%';
    picture.style.objectFit = 'cover';
    flyer.appendChild(picture);
  }

  document.body.appendChild(flyer);
  activeFlyer = flyer;

  const animation = flyer.animate(buildFrames(startX, startY, targetX, targetY), {
    duration: FLIGHT_MS,
    easing: 'linear',
    fill: 'forwards',
  });
  activeAnimation = animation;

  animation.onfinish = () => {
    removeFlyer(flyer);
    window.dispatchEvent(new CustomEvent('cart-item-landed'));
  };

  animation.oncancel = () => {
    removeFlyer(flyer);
  };
}
