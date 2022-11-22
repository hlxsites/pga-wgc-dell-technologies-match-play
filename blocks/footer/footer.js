import {
  readBlockConfig,
  decorateIcons,
  decorateLinkedPictures,
  createOptimizedPicture,
  lookupPages,
  wrapImgsInLinks,
  fetchPlaceholders,
} from '../../scripts/scripts.js';

function setupCookieChoices(section) {
  const cookieLink = section.querySelector('a[href*="onetrust-link"]');
  if (cookieLink) {
    cookieLink.removeAttribute('href');
    cookieLink.className = 'ot-sdk-show-settings';
    cookieLink.id = 'ot-sdk-btn';
    cookieLink.parentNode.className = 'onetrust-link';
  }
}

function setupSocialButtons(section) {
  section.querySelectorAll('p').forEach((button) => {
    const icon = [...button.querySelector('.icon').classList][1].replace('icon-', '');
    button.classList.add(`footer-social-${icon}`);
  });
}

async function setupPartners(section) {
  const pages = await lookupPages();
  const { sponsorOrder } = await fetchPlaceholders();
  const sponsors = pages.filter((e) => e.path.startsWith('/sponsors/'));
  const orderedSponsors = [];
  if (sponsorOrder) {
    sponsorOrder.split(',').forEach((sp) => {
      // eslint-disable-next-line no-param-reassign
      sp = sp.trim();
      const match = sponsors.find((sponsor) => sponsor.title === sp);
      if (match) {
        // remove match from sponsors
        sponsors.splice(sponsors.indexOf(match), 1);
        // add match to ordered sponsors
        orderedSponsors.push(match);
      }
    });
  }

  const wrapper = document.createElement('div');
  // combine ordered sponsors with any remaining unordered sponsors
  [...orderedSponsors, ...sponsors].forEach((sponsor) => {
    const partner = document.createElement('div');
    partner.className = 'footer-partner';
    const link = document.createElement('a');
    link.href = sponsor.link;
    link.append(createOptimizedPicture(sponsor.image, sponsor.title, false, [{ width: '300' }]));
    partner.append(link);
    wrapper.append(partner);
  });
  section.append(wrapper);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';

  // fetch footer content
  const footerPath = config.footer || '/footer';
  const resp = await fetch(`${footerPath}.plain.html`);
  if (resp.ok) {
    const html = await resp.text();

    // decorate footer DOM
    const footer = document.createElement('div');
    footer.innerHTML = html;

    // some of these classes aren't really semantically correct anymore
    // there are 5 sections, but the order is nav, links, tours, social, copyright
    // decided to just leave it as is, for simplicity with minor changes to css/js to accomodate

    const hasPartners = footer.children.length > 4;
    let classes = ['partners', 'nav', 'links', 'social', 'copyright'];
    if (!hasPartners) {
      classes = ['nav', 'links', 'social', 'copyright'];
    }
    classes.forEach((c, i) => {
      const section = footer.children[i];
      if (section) section.classList.add(`footer-${c}`);
    });

    // setup ribbon
    const ribbon = document.createElement('div');
    ribbon.classList.add('footer', 'footer-ribbon');
    const wrapper = document.createElement('div');

    if (hasPartners) {
      wrapper.append(footer.querySelector('.footer-partners'));
    } else {
      wrapper.append(footer.querySelector('.footer-nav'));
    }

    ribbon.append(wrapper);

    setupCookieChoices(footer.querySelector('.footer-nav'));
    setupSocialButtons(footer.querySelector('.footer-social'));

    block.append(footer);
    block.parentNode.prepend(ribbon);
    wrapImgsInLinks(block);
    decorateIcons(block);
    decorateLinkedPictures(block);

    if (hasPartners) {
      await setupPartners(ribbon.querySelector('.footer-partners'));
    }
  }
}
