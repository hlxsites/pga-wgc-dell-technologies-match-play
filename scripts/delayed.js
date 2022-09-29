// eslint-disable-next-line import/no-cycle
import { decorateIcons, fetchPlaceholders, sampleRUM } from './scripts.js';

const placeholders = await fetchPlaceholders();
const isProd = window.location.hostname.endsWith(placeholders.hostname);

if (!isProd === 'this') {
  // temporary override for analytics testing
  if (!localStorage.getItem('OptIn_PreviousPermissions')) localStorage.setItem('OptIn_PreviousPermissions', '{"aa":true,"mediaaa":true,"target":true,"ecid":true,"adcloud":true,"aam":true,"campaign":true,"livefyre":false}');
}

function loadScript(url, callback, type) {
  const head = document.querySelector('head');
  if (!head.querySelector(`script[src="${url}"]`)) {
    const script = document.createElement('script');
    script.src = url;
    if (type) script.setAttribute('type', type);
    head.append(script);
    script.onload = callback;
    return script;
  }
  return head.querySelector(`script[src="${url}"]`);
}

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
window.pgatour = window.pgatour || {};
window.pgatour.tracking = {
  branch: {
    apiKey: 'key_live_nnTvCBCejtgfn40wtbQ6ckiprsemNktJ',
    isWebView: 'false',
  },
  krux: {
    id: '',
  },
  indexExchange: {
    status: false,
  },
};

const pageType = window.location.pathname === '/' ? 'homePage' : 'contentPage';

const pname = window.location.pathname.split('/').pop();
window.pgatour.Omniture = {
  properties: {
    pageName: `pgatour:tournaments:the-players-championship:${pname}`,
    eVar16: `pgatour:tournaments:the-players-championship:${pname}`,
    prop18: pageType,
    eVar1: 'pgatour',
    prop1: 'pgatour',
    prop2: 'r011',
    eVar2: 'r011',
    eVar6: window.location.href,
  },
  defineOmnitureVars: () => {
    if (window.s) {
      Object.assign(window.s, window.pgatour.Omniture.properties);
    }
  },

};

window.pgatour.docWrite = document.write.bind(document);

/* setup favorite players */
function alphabetize(a, b) {
  if (a.nameL.toUpperCase() < b.nameL.toUpperCase()) return -1;
  if (a.nameL.toUpperCase() > b.nameL.toUpperCase()) return 1;
  return 0;
}

async function loadPlayers() {
  if (!window.players) {
    const resp = await fetch('https://statdata.pgatour.com/players/player.json');
    if (resp.ok) {
      const { plrs } = await resp.json();
      const players = {
        byId: {},
        r: [],
        s: [],
        h: [],
      };
      plrs.forEach((p) => {
        if (!players.byId[p.pid]) {
          players.byId[p.pid] = p;
          // display in pga tour (R)
          if (p.disR === 'y') players.r.push(p);
          // display in champions tour (S)
          if (p.disS === 'y') players.s.push(p);
          // display in korn ferry tour (H)
          if (p.disH === 'y') players.h.push(p);
        }
      });
      players.r.sort(alphabetize);
      players.s.sort(alphabetize);
      players.h.sort(alphabetize);
      window.players = players;
    }
  }
  return window.players || {};
}

function updateSelectPlayer(select, tour, players) {
  select.innerHTML = '';
  // eslint-disable-next-line no-use-before-define
  select.addEventListener('change', clearFindPlayer);
  const defaultOption = document.createElement('option');
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = 'Select Player';
  select.prepend(defaultOption);
  players.forEach((player) => {
    const option = document.createElement('option');
    option.setAttribute('data-tour', tour);
    option.setAttribute('value', player.pid);
    option.textContent = `${player.nameL}, ${player.nameF}`;
    select.append(option);
  });
}

function updateFindPlayerInput(e) {
  const target = e.target.closest('li');
  const input = target.parentNode.parentNode.querySelector('input');
  input.value = target.textContent;
  input.setAttribute('data-value', target.getAttribute('value'));
  // eslint-disable-next-line no-use-before-define
  clearSelectPlayer();
}

function updateFindPlayer(input, tour, players) {
  const wrapper = input.parentNode.querySelector('.gigya-find-player-options');
  players.forEach((player) => {
    const option = document.createElement('li');
    option.className = 'hide';
    option.setAttribute('data-tour', tour);
    option.setAttribute('value', player.pid);
    option.textContent = `${player.nameL}, ${player.nameF}`;
    option.addEventListener('click', updateFindPlayerInput);
    wrapper.append(option);
  });
}

function filterFindPlayer(e) {
  const { target } = e;
  const value = target.value.trim().toLowerCase();
  const parent = target.parentNode.querySelector('.gigya-find-player-options');
  let visibleOptions = 0;
  parent.querySelectorAll('li').forEach((option) => {
    if (value.length && option.textContent.toLowerCase().includes(value)) {
      option.classList.remove('hide');
      visibleOptions += 1;
    } else {
      option.classList.add('hide');
    }
  });
  parent.setAttribute('data-options', visibleOptions);
}

function setupFindPlayer(input) {
  const options = document.createElement('ul');
  options.className = 'gigya-find-player-options';
  input.after(options);
  input.addEventListener('keyup', filterFindPlayer);
}

function getPlayerIdFromForm() {
  const findPlayer = document.querySelector('input[name="data.findPlayer"]');
  const findValue = findPlayer.getAttribute('data-value');
  const selectPlayer = document.querySelector('select[name="data.players"]');
  const selectValue = selectPlayer.value === 'Select Player' ? null : selectPlayer.value;
  return findValue || selectValue;
}

function getTourCodeFromForm() {
  return document.querySelector('select[name="data.tour"]').value;
}

function clearFindPlayer() {
  const findPlayer = document.querySelector('input[name="data.findPlayer"]');
  if (findPlayer) {
    findPlayer.value = '';
    findPlayer.removeAttribute('data-value');
  }
}

function clearSelectPlayer() {
  const selectPlayer = document.querySelector('select[name="data.players"]');
  if (selectPlayer) selectPlayer.selectedIndex = 0;
}

async function updateFavoritePlayersAfterAdd(res) {
  // eslint-disable-next-line no-use-before-define
  await writeFavoritePlayers(res.requestParams.data.favorites);
  clearFindPlayer();
  clearSelectPlayer();
}

async function updateFavoritePlayersAfterRemove(res) {
  // eslint-disable-next-line no-use-before-define
  await writeFavoritePlayers(res.requestParams.data.favorites);
}

function addFavoritePlayer(res) {
  const { favorites } = res.data;
  const playerId = getPlayerIdFromForm();
  const tourCode = getTourCodeFromForm();
  const alreadyInFavorites = favorites.find((fave) => fave.playerId === playerId);
  if (!alreadyInFavorites) {
    favorites.push({
      createdDate: new Date().toISOString(),
      tourCode,
      playerId,
    });
    // eslint-disable-next-line no-undef
    gigya.accounts.setAccountInfo({
      data: { favorites },
      callback: updateFavoritePlayersAfterAdd,
    });
  } else {
    clearFindPlayer();
    clearSelectPlayer();
  }
}

function removeFavoritePlayer(res) {
  const { favorites } = res.data;
  const favoritesList = document.querySelector('.gigya-your-favorites');
  const selectedPlayer = favoritesList.querySelector('[data-selected="true"]');
  selectedPlayer.removeAttribute('data-selected');
  const playerId = selectedPlayer.getAttribute('data-id');
  const playerToRemove = favorites.find((fave) => fave.playerId === playerId);
  if (playerToRemove) {
    const newFavorites = favorites.filter((fave) => fave !== playerToRemove);
    // eslint-disable-next-line no-undef
    gigya.accounts.setAccountInfo({
      data: { favorites: newFavorites },
      callback: updateFavoritePlayersAfterRemove,
    });
  }
}

function updateFavoritePlayers(e, operation, id) {
  e.preventDefault();
  if (id && operation === 'add') {
    // eslint-disable-next-line no-undef
    gigya.accounts.getAccountInfo({ callback: addFavoritePlayer });
  } else if (id && operation === 'remove') {
    // eslint-disable-next-line no-undef
    gigya.accounts.getAccountInfo({ callback: removeFavoritePlayer });
  }
}

async function writeFavoritePlayers(favorites) {
  const wrapper = document.querySelector('.gigya-your-favorites');
  wrapper.innerHTML = '';
  const players = await loadPlayers();
  favorites.forEach((favorite) => {
    const player = players.byId[favorite.playerId];
    const row = document.createElement('div');
    row.setAttribute('data-tour', favorite.tourCode);
    row.setAttribute('data-id', favorite.playerId);
    row.innerHTML = `<p>${player.nameF} ${player.nameL}</p>
      <button><span class="icon icon-close"></span></button>`;
    const button = row.querySelector('button');
    button.addEventListener('click', (e) => {
      const target = e.target.closest('[data-id]');
      target.setAttribute('data-selected', true);
      const id = target.getAttribute('data-id');
      updateFavoritePlayers(e, 'remove', id);
    });
    wrapper.append(row);
  });
}

async function setupFavoritePlayersScreen(userData) {
  const players = await loadPlayers();
  // setup user favorites
  const wrapper = document.createElement('div');
  wrapper.className = 'gigya-your-favorites';
  const h2 = document.querySelector('h2[data-translation-key="HEADER_53211634253006840_LABEL"]');
  if (h2) h2.after(wrapper);
  if (userData && userData.favorites) {
    await writeFavoritePlayers(userData.favorites);
  }
  // setup add more
  const tourDropdown = document.querySelector('select[name="data.tour"]');
  const findPlayer = document.querySelector('input[name="data.findPlayer"]');
  const selectPlayer = document.querySelector('select[name="data.players"]');
  const addButton = document.querySelector('.js-add-player.gigya-add-player');
  if (tourDropdown && findPlayer && selectPlayer && addButton) {
    tourDropdown.addEventListener('change', () => {
      const { value } = tourDropdown;
      findPlayer.setAttribute('data-filter', value);
      clearFindPlayer();
      updateFindPlayer(findPlayer, value, players[value]);
      selectPlayer.setAttribute('data-filter', value);
      clearSelectPlayer();
      updateSelectPlayer(selectPlayer, value, players[value]);
    });
    setupFindPlayer(findPlayer);
    updateFindPlayer(findPlayer, tourDropdown.value, players[tourDropdown.value]);
    updateSelectPlayer(selectPlayer, tourDropdown.value, players[tourDropdown.value]);
    addButton.addEventListener('click', (e) => {
      const id = getPlayerIdFromForm();
      updateFavoritePlayers(e, 'add', id);
    });
  }
  // remove non-submit button
  const submit = document.querySelector('#gigya-players-screen.gigya-screen input[type=submit].gigya-input-submit');
  if (submit) submit.remove();
}

function setupAccountMenu(res) {
  // setup favorite players
  if (res.currentScreen === 'gigya-players-screen') {
    setupFavoritePlayersScreen(res.data);
  }
  // setup logout
  const logoutBtn = document.querySelector('a[href="javascript:pgatour.GigyaSocialize.logout()"]');
  if (logoutBtn) {
    logoutBtn.removeAttribute('href');
    // eslint-disable-next-line no-use-before-define
    logoutBtn.addEventListener('click', logout);
    logoutBtn.style.cursor = 'pointer';
  }
}

/* setup user authentication */
function saveUserInfo(userInfo) {
  sessionStorage.setItem('gigyaAccount', JSON.stringify(userInfo));
}

function removeUserInfo() {
  sessionStorage.removeItem('gigyaAccount');
}

function showAccountMenu() {
  // eslint-disable-next-line no-undef
  gigya.accounts.showScreenSet({
    screenSet: 'Website-ManageProfile',
    onAfterScreenLoad: setupAccountMenu,
  });
}

function showLoginMenu() {
  // eslint-disable-next-line no-undef
  gigya.accounts.showScreenSet({
    screenSet: 'Website-RegistrationLogin',
    startScreen: 'gigya-long-login-screen',
    // eslint-disable-next-line no-use-before-define
    onAfterSubmit: updateUserButton,
  });
}

function updateUserButton(user) {
  // eslint-disable-next-line no-param-reassign
  if (user.eventName === 'afterSubmit') user = user.response.user;
  const button = document.getElementById('nav-user-button');
  if (user && user != null && user.isConnected) {
    saveUserInfo({
      isConnected: user.isConnected,
      thumbnailURL: user.thumbnailURL,
    });
    // add button caret
    button.innerHTML = `${button.innerHTML}<span class="icon icon-caret"></span>`;
    // update button text
    const text = button.querySelector('span:not([class])');
    text.textContent = 'Manage Profile';
    // update button icon
    if (user.thumbnailURL.length > 0 && !button.querySelector('img')) {
      const icon = button.querySelector('span.icon.icon-user');
      const img = document.createElement('img');
      img.src = user.thumbnailURL;
      img.alt = 'User Profile Thumbnail';
      icon.replaceWith(img);
    }
    // reset click to open manage account
    button.removeEventListener('click', showLoginMenu);
    button.addEventListener('click', showAccountMenu);
  }
}

function clearUserButton() {
  const button = document.getElementById('nav-user-button');
  if (button) {
    // remove caret
    const caret = button.querySelector('.icon.icon-caret');
    if (caret) caret.remove();
    // update button text
    const text = button.querySelector('span:not([class])');
    text.textContent = 'Login/Register';
    // update button icon
    const img = button.querySelector('img');
    if (img) {
      const icon = document.createElement('span');
      icon.classList.add('icon', 'icon-user');
      img.replaceWith(icon);
      decorateIcons(button);
    }
    // reset click to open login menu
    button.removeEventListener('click', showAccountMenu);
    button.addEventListener('click', showLoginMenu);
  }
}

function logout() {
  clearUserButton();
  // eslint-disable-next-line no-undef
  gigya.accounts.hideScreenSet({ screenSet: 'Website-ManageProfile' });
  // eslint-disable-next-line no-undef
  gigya.socialize.logout({ callback: removeUserInfo });
}

function setupUserButton(res) {
  const button = document.getElementById('nav-user-button');
  if (button) {
    if (res && res != null && res.errorCode === 0) { // user is logged in
      const user = res.profile;
      user.isConnected = true;
      updateUserButton(user);
    } else {
      clearUserButton();
      removeUserInfo();
      // set click to open login menu
      button.addEventListener('click', showLoginMenu);
    }
    button.setAttribute('data-status', 'initialized');
  }
}

function checkIfLoggedIn(res) {
  if (res && res != null && res.errorCode === 0) { // user is logged in
    // eslint-disable-next-line no-undef
    gigya.accounts.getAccountInfo({ callback: setupUserButton });
  } else {
    clearUserButton();
    removeUserInfo();
    setupUserButton();
  }
}

function setupGigya() {
  // eslint-disable-next-line no-undef
  gigya.accounts.session.verify({ callback: checkIfLoggedIn });
}

// eslint-disable-next-line import/prefer-default-export
export function initGigya() {
  const button = document.getElementById('nav-user-button');
  if (button) button.removeEventListener('click', initGigya);
  loadScript(
    'https://cdns.gigya.com/JS/socialize.js?apikey=3__4H034SWkmoUfkZ_ikv8tqNIaTA0UIwoX5rsEk96Ebk5vkojWtKRZixx60tZZdob',
    setupGigya,
  );
}

initGigya();

/* status bar weather */
async function populateStatusBar(statusBar) {
  if (statusBar) {
    const statusBarData = document.querySelector('.status-bar-data');
    // fetch weather
    try {
      const resp = await fetch('https://little-forest-58aa.david8603.workers.dev/?url=https://www.pgatour.com/bin/data/feeds/weather.json/r011');
      const { current_observation: weatherData } = await resp.json();
      const location = weatherData.display_location.full;
      const icon = weatherData.icon_url.replace('.gif', '.png');
      const temp = weatherData.temp_f;
      const weather = document.createElement('div');
      weather.className = 'status-bar-weather';
      weather.innerHTML = `<p>
          <a href="/weather">
            <span>${location}</span>
            <img src="${icon}" alt="${weatherData.weather}"/ >
            <span class="status-bar-temp">${temp}</span>
          </a>
        </p>`;
      statusBarData.append(weather);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('failed to load weather', error);
    }
  }
}

populateStatusBar(document.querySelector('header > .status-bar'));

/* setup cookie preferences */
function getCookie(cookieName) {
  const name = `${cookieName}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const split = decodedCookie.split(';');
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < split.length; i++) {
    let c = split[i];
    while (c.charAt(0) === ' ') c = c.substring(1);
    if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
  }
  return null;
}

async function OptanonWrapper() {
  const geoInfo = window.Optanon.getGeolocationData();
  Object.keys(geoInfo).forEach((key) => {
    const cookieName = `PGAT_${key.charAt(0).toUpperCase() + key.slice(1)}`;
    const cookie = getCookie(cookieName);
    if (!cookie || cookie !== geoInfo[key]) document.cookie = `${cookieName}=${geoInfo[key]}`;
  });

  const OneTrustActiveGroup = () => {
    /* eslint-disable */
    var y = true, n = false;
    var y_y_y = {'aa': y, 'aam': y, 'ecid': y};
    var n_n_n = {'aa': n, 'aam': n, 'ecid': n};
    var y_n_y = {'aa': y, 'aam': n, 'ecid': y};
    var n_y_y = {'aa': n, 'aam': y, 'ecid': y};
    
    if (typeof OnetrustActiveGroups != 'undefined')
      if (OnetrustActiveGroups.includes(',C0002,'))
        return OnetrustActiveGroups.includes(',C0004,')?y_y_y:y_n_y;
      else
        return OnetrustActiveGroups.includes(',C0004,')?n_y_y:n_n_n;
    
    return geoInfo.country == 'US'?y_y_y:n_n_n;
    /* eslint-enable */
  };
  if (!localStorage.getItem('OptIn_PreviousPermissions')) {
    const adobeSettings = OneTrustActiveGroup();
    adobeSettings.tempImplied = true;
    localStorage.setItem('OptIn_PreviousPermissions', JSON.stringify(adobeSettings));
  }

  loadScript(`https://assets.adobedtm.com/d17bac9530d5/90b3c70cfef1/launch-1ca88359b76c${isProd ? '.min' : ''}.js`);
}
const cookieScript = loadScript('https://cdn.cookielaw.org/scripttemplates/otSDKStub.js');
cookieScript.setAttribute('data-domain-script', `262c6c79-a114-41f0-9c07-52cb1fb7390c${isProd ? '' : '-test'}`);

window.OptanonWrapper = OptanonWrapper;
