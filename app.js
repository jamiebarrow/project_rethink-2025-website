const yearView = document.getElementById('year-view');
const yearList = document.getElementById('year-list');
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

const YEAR = 2025;
const months = [
  { name: 'January', days: 31 },
  { name: 'February', days: 28 },
  { name: 'March', days: 31 },
  { name: 'April', days: 30 },
  { name: 'May', days: 31 },
  { name: 'June', days: 30 },
  { name: 'July', days: 31 },
  { name: 'August', days: 31 },
  { name: 'September', days: 30 },
  { name: 'October', days: 31 },
  { name: 'November', days: 30 },
  { name: 'December', days: 31 },
];

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

const formatDayId = (month, day) => {
  const monthText = String(month).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');
  return `${YEAR}-${monthText}-${dayText}`;
};

const buildDayPath = (dayId) => `./${dayId}.html`;

const getDayIdFromHash = () => {
  const hash = window.location.hash.replace('#', '').trim();
  return hash || null;
};

const getAdjacentDayId = (dayId, delta) => {
  if (!dayId) {
    return null;
  }
  const [yearText, monthText, dayText] = dayId.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }
  const date = new Date(year, month - 1, day + delta);
  if (date.getFullYear() !== YEAR) {
    return null;
  }
  return formatDayId(date.getMonth() + 1, date.getDate());
};

const buildYearView = () => {
  if (!yearList) {
    return;
  }
  yearList.innerHTML = '';
  months.forEach((month, index) => {
    const heading = document.createElement('h3');
    heading.className = `font-bold my-4${index % 2 ? ' text-end' : ''}`;
    heading.textContent = month.name;

    const list = document.createElement('ol');
    list.className = `flex flex-wrap gap-x-4 gap-y-4${index % 2 ? ' justify-end' : ''}`;

    for (let day = 1; day <= month.days; day += 1) {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      const dayId = formatDayId(index + 1, day);
      link.href = `#${dayId}`;
      link.dataset.day = dayId;
      link.textContent = String(day);
      listItem.appendChild(link);
      list.appendChild(listItem);
    }

    yearList.appendChild(heading);
    yearList.appendChild(list);
  });
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
    gallery.classList.add('day-gallery');
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

const showDayView = async (dayId, updateHistory = true) => {
  const href = buildDayPath(dayId);
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
      window.history.pushState({ day: dayId }, '', `#${dayId}`);
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

const syncWithHash = () => {
  const dayId = getDayIdFromHash();
  if (dayId) {
    showDayView(dayId, false);
    return;
  }
  showYearView();
};

yearView.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) {
    return;
  }
  event.preventDefault();
  const dayId = link.dataset.day || link.getAttribute('href').replace('#', '');
  showDayView(dayId);
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
    if (dayView.classList.contains('is-hidden')) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      const dayId = getDayIdFromHash();
      const previous = getAdjacentDayId(dayId, -1);
      if (previous) {
        showDayView(previous);
      }
    }
    if (event.key === 'ArrowRight') {
      const dayId = getDayIdFromHash();
      const next = getAdjacentDayId(dayId, 1);
      if (next) {
        showDayView(next);
      }
    }
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

window.addEventListener('popstate', syncWithHash);
window.addEventListener('hashchange', syncWithHash);

buildYearView();
syncWithHash();
