const yearView = document.getElementById('year-view');
const dayView = document.getElementById('day-view');
const dayTitle = document.getElementById('day-title');
const dayBody = document.getElementById('day-body');
const dayBack = document.getElementById('day-back');

const modal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const modalCaption = document.getElementById('modal-caption');
const modalClose = document.getElementById('modal-close');
const modalPrev = document.getElementById('modal-prev');
const modalNext = document.getElementById('modal-next');

let currentImages = [];
let currentImageIndex = 0;
let currentCaption = '';
let touchStartX = 0;
let touchStartY = 0;

const hideElement = (element) => {
  element.classList.add('is-hidden');
  element.setAttribute('aria-hidden', 'true');
};

const showElement = (element) => {
  element.classList.remove('is-hidden');
  element.setAttribute('aria-hidden', 'false');
};

const formatCaption = (image) => {
  if (!image) {
    return '';
  }
  return currentCaption || image.getAttribute('alt') || image.getAttribute('src') || '';
};

const updateModalImage = (index) => {
  if (!currentImages.length) {
    return;
  }
  currentImageIndex = (index + currentImages.length) % currentImages.length;
  const image = currentImages[currentImageIndex];
  modalImage.src = image.getAttribute('src');
  modalImage.alt = image.getAttribute('alt') || '';
  modalCaption.textContent = formatCaption(image);
};

const openModal = (index) => {
  if (!currentImages.length) {
    return;
  }
  updateModalImage(index);
  showElement(modal);
  document.body.classList.add('modal-open');
};

const closeModal = () => {
  hideElement(modal);
  document.body.classList.remove('modal-open');
};

const parseDayContent = (htmlText) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const dayHeading = doc.querySelector('h1');
  const content = doc.querySelector('#post-container');
  return {
    heading: dayHeading ? dayHeading.textContent.trim() : 'Selected day',
    content: content ? content.innerHTML : '<p>No content found.</p>',
  };
};

const prepareImages = () => {
  const images = Array.from(dayBody.querySelectorAll('img'));
  currentImages = images;
  const dayHashtag = dayBody.querySelector('h2');
  currentCaption = dayHashtag ? dayHashtag.textContent.trim() : '';

  images.forEach((image, index) => {
    image.classList.add('day-image');
    image.setAttribute('tabindex', '0');
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', 'Open image');
    if (!image.parentElement.classList.contains('day-image-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('day-image-wrapper');
      image.parentElement.insertBefore(wrapper, image);
      wrapper.appendChild(image);
    }
    image.addEventListener('click', () => openModal(index));
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(index);
      }
    });
  });

  const galleries = Array.from(dayBody.querySelectorAll('.grid'));
  galleries.forEach((gallery) => {
    const galleryImages = Array.from(gallery.querySelectorAll('img'));
    if (!galleryImages.length) {
      return;
    }
    gallery.classList.add('day-gallery');
    galleryImages.forEach((image, index) => {
      const wrapper = image.closest('.day-image-wrapper');
      if (!wrapper) {
        return;
      }
      wrapper.classList.toggle('day-image-wrapper--hidden', index >= 4);
    });

    if (galleryImages.length > 4) {
      const moreCount = galleryImages.length - 4;
      const wrappers = gallery.querySelectorAll('.day-image-wrapper');
      const lastVisible = wrappers[3];
      if (lastVisible) {
        lastVisible.classList.add('day-image-wrapper--more');
        lastVisible.setAttribute('data-more', `+${moreCount} more`);
      }
    }
  });
};

const handleTouchStart = (event) => {
  if (event.touches.length !== 1) {
    return;
  }
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
};

const handleTouchEnd = (event) => {
  if (!event.changedTouches.length) {
    return;
  }
  const deltaX = event.changedTouches[0].clientX - touchStartX;
  const deltaY = event.changedTouches[0].clientY - touchStartY;
  const swipeThreshold = 50;

  if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) < Math.abs(deltaY)) {
    return;
  }

  if (deltaX > 0) {
    updateModalImage(currentImageIndex - 1);
  } else {
    updateModalImage(currentImageIndex + 1);
  }
};

const showDayView = async (href, updateHistory = true) => {
  try {
    const response = await fetch(href, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Failed to load day content.');
    }
    const htmlText = await response.text();
    const parsed = parseDayContent(htmlText);
    dayTitle.textContent = parsed.heading;
    dayBody.innerHTML = parsed.content;
    prepareImages();
    hideElement(yearView);
    showElement(dayView);

    if (updateHistory) {
      const url = new URL(href, window.location.href);
      window.history.pushState({ day: url.pathname }, '', `#${url.pathname}`);
    }
  } catch (error) {
    dayTitle.textContent = 'Unable to load day';
    dayBody.innerHTML = '<p>Sorry, something went wrong.</p>';
    hideElement(yearView);
    showElement(dayView);
  }
};

const showYearView = () => {
  showElement(yearView);
  hideElement(dayView);
  window.history.pushState({}, '', window.location.pathname);
};

yearView.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) {
    return;
  }
  event.preventDefault();
  showDayView(link.getAttribute('href'));
});

dayBack.addEventListener('click', showYearView);

modalClose.addEventListener('click', closeModal);
modalPrev.addEventListener('click', () => updateModalImage(currentImageIndex - 1));
modalNext.addEventListener('click', () => updateModalImage(currentImageIndex + 1));

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

modalImage.addEventListener('touchstart', handleTouchStart, { passive: true });
modalImage.addEventListener('touchend', handleTouchEnd);

window.addEventListener('keydown', (event) => {
  if (modal.classList.contains('is-hidden')) {
    return;
  }
  if (event.key === 'Escape') {
    closeModal();
  }
  if (event.key === 'ArrowLeft') {
    updateModalImage(currentImageIndex - 1);
  }
  if (event.key === 'ArrowRight') {
    updateModalImage(currentImageIndex + 1);
  }
});

window.addEventListener('popstate', () => {
  if (window.location.hash) {
    const path = window.location.hash.replace('#', '');
    showDayView(path, false);
    return;
  }
  showYearView();
});

if (window.location.hash) {
  const path = window.location.hash.replace('#', '');
  showDayView(path, false);
}
