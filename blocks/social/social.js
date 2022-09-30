import { readBlockConfig, decorateIcons, fetchPlaceholders } from '../../scripts/scripts.js';

const TWITTER_URL = 'https://twitter.com/';
const INSTAGRAM_URL = 'https://instagram.com/';

function buildProfilesTile(config) {
  const profiles = document.createElement('li');
  profiles.className = 'social-tile-profiles';
  const socialProfiles = document.createElement('div');
  socialProfiles.innerHTML = '<h3>Follow Us</h3><p class="button-container"></p>';
  Object.keys(config).forEach((key) => {
    if (key === 'newsletter') {
      const newsletter = document.createElement('div');
      newsletter.innerHTML = `<h3>Get Updates</h3>
      <p class="button-container">
        <a href="${config[key]}" class="button social-profile"><span class="icon icon-email"></span></a>
      </p>`;
      profiles.append(newsletter);
    } else {
      const a = document.createElement('a');
      a.className = 'button social-profile';
      a.href = config[key];
      a.innerHTML = `<span class="icon icon-${key}"></span>`;
      socialProfiles.querySelector('.button-container').append(a);
    }
  });
  if (socialProfiles.querySelector('a')) profiles.append(socialProfiles);
  decorateIcons(profiles);
  return profiles;
}

function wrapInLinks(tweet) {
  const words = tweet.textContent.replace(/\n/g, ' ').split(' ').filter((w) => w);
  words.forEach((word, i) => {
    if (word.startsWith('#')) { // setup hashtag
      words[i] = `<a href="${TWITTER_URL}search?=${word.replace('#', '')}">${word}</a>`;
    } else if (word.startsWith('@')) { // setup mention
      words[i] = `<a href="${TWITTER_URL}${word.replace('@', '')}">${word}</a>`;
    } else if (word.startsWith('.@')) { // setup mention at beginning of tweet
      words[i] = `.<a href="${TWITTER_URL}${word.replace('.@', '')}">${word.replace('.', '')}</a>`;
    } else if (word.startsWith('http')) { // setup link
      words[i] = `<a href="${word}">${word}</a>`;
    }
  });
  tweet.innerHTML = words.join(' ');
}

function writeDate(timestamp) {
  const date = new Date(timestamp);
  const month = date.toString().substring(4, 7);
  const day = date.getDate().toString().padStart(2, '0');
  return `${day} ${month}`;
}

function buildTwitterTile(tile, data) {
  const { user } = data;
  const profileURL = `${TWITTER_URL}${user.screen_name}`;
  const grid = document.createElement('div');
  grid.className = 'social-tile-grid social-tile-twitter';
  // setup twitter header
  const head = document.createElement('div');
  head.className = 'social-twitter-header';
  head.innerHTML = `<a href="${profileURL}" class="social-twitter-img"><img src="${user.profile_image_url_https}" alt="${user.name} profile picture" /></a>
    <p class="social-twitter-username"><a href="${profileURL}">${user.name}</a></p>
    <a href="${TWITTER_URL}" class="social-twitter-network"><span class="icon icon-twitter"></span></a>
    <p class="social-twitter-screenname"><a href="${profileURL}">${user.screen_name}</a></p>
    <p class="social-twitter-date">${writeDate(data.created_at)}</p>`;
  grid.append(head);
  // setup twitter tweet
  const tweet = document.createElement('div');
  tweet.className = 'social-twitter-tweet';
  tweet.innerHTML = `<div class="social-tweet-body">
    <p>${data.text}</p>
  </div>`;
  wrapInLinks(tweet.querySelector('.social-tweet-body'));
  if (data.extended_entities && data.extended_entities.media) {
    const media = data.extended_entities.media[0];
    const img = document.createElement('img');
    img.className = 'social-tweet-img';
    img.src = media.media_url_https;
    tweet.prepend(img);
  }
  grid.append(tweet);
  // setup twitter footer
  const foot = document.createElement('div');
  foot.className = 'social-tile-footer';
  foot.innerHTML = `<a href="${TWITTER_URL}intent/tweet?in_reply_to=${data.id_str}"><span class="icon icon-reply"></span></a>
    <a href="${TWITTER_URL}intent/retweet?tweet_id=${data.id_str}"><span class="icon icon-retweet"></span></a>
    <a href="${TWITTER_URL}intent/favorite?tweet_id=${data.id_str}"><span class="icon icon-like"></span></a>`;
  tile.append(grid);
  tile.append(foot);
}

function buildImageTile(tile, data) {
  tile.innerHTML = `<a href="${data.postUrl}"></a>`;
  const a = tile.querySelector('a');
  const image = document.createElement('div');
  image.className = 'social-tile-img';
  image.innerHTML = `<img src="${data.imageUrl}" />`;
  const body = document.createElement('div');
  body.className = 'social-tile-body';
  body.innerHTML = `<p><a href="${data.profileUrl}"><span class="icon icon-${data.network}"></span></a></p>
    <p class="social-tile-screenname"><a href="${data.profileUrl}" target="_blank">${data.username}</span></a></p>`;
  a.append(image, body);
  decorateIcons(tile);
  return tile;
}

function refreshImageTiles(wrapper, available, onPage) {
  setInterval(() => {
    const randomIndex = (max) => Math.floor(Math.random() * (max + 1));
    const tiles = wrapper.children;
    const toRefreshIndex = randomIndex(tiles.length);
    const tileToRefresh = tiles[toRefreshIndex];
    if (tileToRefresh) {
      const refreshIndex = randomIndex(available.length);
      const newTile = available[refreshIndex];
      if (newTile) {
        available.splice(refreshIndex, 1);
        available.push(tileToRefresh);
        onPage.splice(toRefreshIndex, 1);
        onPage.push(newTile);
        tileToRefresh.replaceWith(newTile);
      }
    }
  }, 3 * 1000);
}

async function buildImageFeed(wrapper, config) {
  const resp = await fetch(`https://api.massrelevance.com/6krq3qgxx2/${config.stream}.json?limit=40&tweet_mode=extended`);
  const availableTiles = [];
  const tilesOnPage = [];
  if (resp.ok) {
    const stream = await resp.json();
    let index = 0;
    stream.forEach((item, i) => {
      const tile = document.createElement('li');
      const { network } = item;
      let username;
      let profileUrl;
      let postUrl;
      let imageUrl;
      if (network === 'twitter') {
        username = item.user.screen_name;
        profileUrl = `${TWITTER_URL}${username}/`;
        postUrl = item.full_text.split(' ').pop();
        imageUrl = item.entities.media[0].media_url_https;
      } else if (network === 'instagram') {
        username = item.user.username;
        profileUrl = `${INSTAGRAM_URL}${username}/`;
        postUrl = item.link;
        imageUrl = item.images.low_resolution.url;
      }
      if (network === 'twitter' || network === 'instagram') {
        const imageTile = buildImageTile(tile, {
          network, username, profileUrl, postUrl, imageUrl,
        });
        if (tilesOnPage.length < 10 && i % 2 === 0) { // attempt to avoid duplicates
          [...wrapper.children][index].replaceWith(tile);
          tilesOnPage.push(tile);
          index += 1;
        } else {
          availableTiles.push(imageTile);
        }
      }
    });
    refreshImageTiles(wrapper, availableTiles, tilesOnPage);
  }
}

async function buildSocialFeed(wrapper, config) {
  const placeholders = await fetchPlaceholders();
  // setup profiles tile
  const profilesTile = buildProfilesTile(config);
  // fetch social feed
  wrapper.append(profilesTile);
  const tournament = `${placeholders.tourCode}${placeholders.tournamentId}`;
  const resp = await fetch(`https://api.massrelevance.com/brgyan07p/tournament_${tournament}.json`);
  if (resp.ok) {
    const feed = await resp.json();
    feed.forEach((item) => {
      const tile = document.createElement('li');
      if (item.network === 'twitter') buildTwitterTile(tile, item);
      decorateIcons(tile);
      wrapper.append(tile);
    });
  }
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.innerHTML = '';

  const wrapper = document.createElement('ul');

  // setup placeholder content
  if (block.className.includes('image-feed')) {
    block.parentElement.classList.add('image-feed-wrapper');
    block.parentElement.parentElement.classList.add('image-feed-container');
    for (let i = 0; i < 10; i += 1) {
      const placeholder = document.createElement('li');
      placeholder.className = 'social-placeholder';
      wrapper.append(placeholder);
    }
  }

  const observer = new IntersectionObserver(async (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();

      if (block.className.includes('image-feed')) {
        await buildImageFeed(wrapper, config);
      } else {
        await buildSocialFeed(wrapper, config);
      }
      block.append(wrapper);
    }
  }, { threshold: 0 });

  observer.observe(block);
}
