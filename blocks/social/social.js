import { readBlockConfig, decorateIcons, fetchPlaceholders } from '../../scripts/scripts.js';

const TWITTER_URL = 'https://twitter.com/';

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

export default async function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';
  const placeholders = await fetchPlaceholders();

  const wrapper = document.createElement('ul');

  // setup profiles tile
  const profilesTile = buildProfilesTile(config);
  wrapper.append(profilesTile);

  // fetch social feed
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
  block.append(wrapper);
}
