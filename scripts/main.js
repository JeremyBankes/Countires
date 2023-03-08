const global = {
    countryMap: null,
    countryNames: null,
    targetCountry: null,
    elements: {}
};

function getRandomCountry() {
    const countryCodes = Object.keys(global.countryMap);
    const countryCode = countryCodes[Math.floor(Math.random() * countryCodes.length)];
    return global.countryMap[countryCode];
}

function getLevenshteinDistance(string1 = '', string2 = '') {
    const track = Array(string2.length + 1).fill(null).map(() => Array(string1.length + 1).fill(null));
    for (let i = 0; i <= string1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= string2.length; j += 1) {
        track[j][0] = j;
    }
    for (let j = 1; j <= string2.length; j += 1) {
        for (let i = 1; i <= string1.length; i += 1) {
            const indicator = string1[i - 1] === string2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1,
                track[j - 1][i] + 1,
                track[j - 1][i - 1] + indicator,
            );
        }
    }
    return track[string2.length][string1.length];
}

/**
 * @param {string} fuzzyString
 */
function getCountryFromFuzzyString(fuzzyString) {
    return Object.values(global.countryMap).reduce((match, country) => {
        const distance = getLevenshteinDistance(country.name.toLowerCase(), fuzzyString.toLowerCase());
        return distance < match.distance ? { distance, country } : match;
    }, { distance: 3, country: null }).country;
}


/**
 * @param {number} latitude1
 * @param {number} longitude1
 * @param {number} latitude2
 * @param {number} longitude2
 */
function getCrowsDistance(latitude1, longitude1, latitude2, longitude2) {
    const R = 6371; // km
    const deltaLatitude = (latitude2 - latitude1) * Math.PI / 180;
    const deltaLongitude = (longitude2 - longitude1) * Math.PI / 180;
    latitude1 = latitude1 * Math.PI / 180;
    latitude2 = latitude2 * Math.PI / 180;
    const a = Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) + Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2) * Math.cos(latitude1) * Math.cos(latitude2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 */
function getDistance(x1, y1, x2, y2) {
    const a = x2 - x1;
    const b = y2 - y1;
    return Math.sqrt(a * a + b * b);
}

function reset() {
    global.targetCountry = getRandomCountry();
    global.elements.targetCountryImage.src = `/images/${global.targetCountry.code}.svg`;
    global.elements.guessInput.disabled = false;
    global.elements.guessButton.value = 'Guess';
    global.elements.message.textContent = "";
    while (global.elements.guessList.firstChild) {
        global.elements.guessList.firstChild.remove();
    }
}

async function load() {
    try {
        global.elements.gameForm = /** @type {HTMLFormElement} */ (document.getElementById('gameForm'));
        global.elements.targetCountryImage = /** @type {HTMLImageElement} */ (document.getElementById('targetCountryImage'));
        global.elements.guessInput = /** @type {HTMLInputElement} */(document.getElementById('guessInput'));
        global.elements.guessButton = /** @type {HTMLInputElement} */(document.getElementById('guessButton'));
        global.elements.guessList = document.getElementById('guessList');
        global.elements.message = document.getElementById('message');

        const response = await fetch('/data/countries.json');
        global.countryMap = await response.json();
        global.countryNames = Object.values(global.countryMap).map(country => country.name);

        global.elements.gameForm.onsubmit = () => {
            const formData = new FormData(global.elements.gameForm);
            if (formData.has('guess')) {
                const guessString = formData.get('guess').toString().substring(0, 32);
                const guess = getCountryFromFuzzyString(guessString);

                if (guess === null) {
                    global.elements.message.textContent = `There is no country named "${guessString}"!`;
                } else {
                    global.elements.gameForm.reset();
                    if (guess === global.targetCountry) {
                        global.elements.message.textContent = `You guessed ${guess.name} in ${global.elements.guessList.childElementCount + 1} guess(es)! Well done!`;
                        global.elements.guessButton.value = 'Replay';
                        global.elements.guessInput.disabled = true;
                    } else {
                        global.elements.message.textContent = '';

                        const distance = getCrowsDistance(guess.latitude, guess.longitude, global.targetCountry.latitude, global.targetCountry.longitude);
                        const arrowDistance = getDistance(guess.longitude, guess.latitude, global.targetCountry.longitude, global.targetCountry.latitude);

                        const arrow = {
                            x: (global.targetCountry.longitude - guess.longitude) / arrowDistance,
                            y: (global.targetCountry.latitude - guess.latitude) / arrowDistance,
                        };

                        const arrowCanvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));

                        const resultListItem = document.createElement('li');
                        const resultImage = document.createElement('img');
                        const resultSpan = document.createElement('span');

                        resultImage.src = `/images/${guess.code}.svg`;
                        resultSpan.textContent = `You guessed ${guess.name}: ${Math.round(distance)}km`;

                        resultListItem.appendChild(arrowCanvas);
                        resultListItem.appendChild(resultImage);
                        resultListItem.appendChild(resultSpan);

                        global.elements.guessList.appendChild(resultListItem);

                        arrowCanvas.width = arrowCanvas.clientWidth;
                        arrowCanvas.height = arrowCanvas.clientWidth;
                        const arrowCanvasSize = (arrowCanvas.width + arrowCanvas.height) / 2;
                        const halfArrowCanvasSize = arrowCanvasSize / 2;
                        const arrowSize = halfArrowCanvasSize * 0.75;
                        arrowCanvas.width = arrowCanvas.height = arrowCanvasSize;
                        const context = arrowCanvas.getContext('2d');

                        context.strokeStyle = 'red';
                        context.beginPath();
                        context.moveTo(halfArrowCanvasSize, halfArrowCanvasSize);
                        context.lineTo(halfArrowCanvasSize + arrowSize * arrow.x, halfArrowCanvasSize - arrowSize * arrow.y);
                        context.stroke();
                    }
                }
            } else {
                reset();
            }
            return false;
        };

        reset();
    } catch (error) {
        console.warn(error);
    } finally {

    }
}

window['global'] = global;

addEventListener('load', load);