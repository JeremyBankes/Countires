import { Dom } from "@lucania/toolbox/client";
import { Data, Text } from "@lucania/toolbox/shared";
import { Reference, InputValueReference, ElementFocusReference, TextContentReference } from "@lucania/vision";

type CountryMeta = {
    code: string
    latitude: number
    longitude: number
    name: string
};

type IncorrectGuess = {
    country: CountryMeta,
    distance: number
};

type CountryMetaMap = { [CountryCode: string]: CountryMeta };

const parser = new DOMParser();

const pointMap = [100, 50, 40, 30, 10];

async function getCountryData() {
    const response = await fetch("/data/countries.json");
    return await response.json() as CountryMetaMap;
}

async function displayCountry(countryMeta: CountryMeta, mapping: Dom.ElementMapping) {
    const response = await fetch(`/images/${countryMeta.code}.svg`);
    const svgSource = await response.text();
    const document = parser.parseFromString(svgSource, "image/svg+xml");
    const [svg] = document.children;
    const paths = svg.querySelectorAll("path");
    for (const path of paths) {
        path.setAttribute("fill", "#ccc");
    }
    Dom.clear(mapping.division.gameBoard);
    mapping.division.gameBoard.append(svg);
    mapping.image.flagImage.src = `https://flagsapi.com/${countryMeta.code}/shiny/64.png`;
}

function getCrowsDistance(latitude1: number, longitude1: number, latitude2: number, longitude2: number) {
    const deltaLatitude = (latitude2 - latitude1) * Math.PI / 180;
    const deltaLongitude = (longitude2 - longitude1) * Math.PI / 180;
    latitude1 = latitude1 * Math.PI / 180;
    latitude2 = latitude2 * Math.PI / 180;
    const a = (
        Math.sin(deltaLatitude / 2) *
        Math.sin(deltaLatitude / 2) +
        Math.sin(deltaLongitude / 2) *
        Math.sin(deltaLongitude / 2) *
        Math.cos(latitude1) *
        Math.cos(latitude2)
    );
    return 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

Dom.onReady(async (mapping) => {
    const countryData = await getCountryData();
    const guessing = new ElementFocusReference(mapping.input.queryInput);
    const query = new InputValueReference(mapping.input.queryInput);
    const progress = new InputValueReference(mapping.input.progress);
    const message = new TextContentReference(mapping.heading.message);
    const suggestions = new Reference<CountryMeta[]>([]);
    const incorrectGuesses = new Reference<IncorrectGuess[]>([]);
    const mysteryCountry = new Reference<CountryMeta | null>(null);
    const playerTurnIndex = new Reference(0);
    const scores = new Reference<number[]>([]);

    mapping.division.welcomePage.classList.remove("removed");

    let spectacleViewIndex = 0;
    const spectacle = mapping.element.spectacle as unknown as SVGElement;
    const updateSpectacle = () => {
        for (let i = 0; i < spectacle.children.length; i++) {
            spectacle.children[i].classList.toggle("removed", i !== spectacleViewIndex);
        }
        spectacleViewIndex = spectacleViewIndex >= spectacle.children.length - 1 ? 0 : spectacleViewIndex + 1;
    };
    setInterval(updateSpectacle, 1000);
    updateSpectacle();

    const guess = (country: CountryMeta) => {
        query.value = "";
        if (mysteryCountry.value === country) {
            const numberOfGuesses = incorrectGuesses.value.length + 1;
            const newPoints = pointMap[Math.min(numberOfGuesses, pointMap.length) - 1];
            message.value = (
                `That is correct! Player ${playerTurnIndex.value + 1} guessed ` +
                `${country.name} in ${numberOfGuesses} ${Text.plural("guess", numberOfGuesses)}! ` +
                `They've been awarded ${newPoints} points!`
            );
            scores.value = scores.value.map((score, index) => playerTurnIndex.value === index ? score + newPoints : score);
            nextPlayersTurn();
            randomizeMysteryCountry();
        } else {
            Data.assert(mysteryCountry.value !== null, "Missing country!");
            const distance = getCrowsDistance(mysteryCountry.value.latitude, mysteryCountry.value.longitude, country.latitude, country.longitude);
            message.value = `${country.name} is incorrect! You were ${distance.toFixed(0)} kilometers off.`;
            incorrectGuesses.value = [...incorrectGuesses.value, { country, distance }];
        }
        updatePointAwardingTable();
    };

    incorrectGuesses.addChangeListener((incorrectGuesses) => {
        Dom.clear(mapping.tableSection.guessTableBody);
        mapping.tableSection.guessTableBody.append(...incorrectGuesses.map((guess, index) => (Dom.create({
            tagName: "tr",
            childNodes: [
                Dom.create({
                    tagName: "td",
                    textContent: `Guess #${index + 1}`
                }),
                Dom.create({
                    tagName: "td",
                    textContent: guess.country.name
                }),
                Dom.create({
                    tagName: "td",
                    textContent: `${guess.distance.toFixed(2)}km`
                })
            ]
        }))));
    });

    const nextPlayersTurn = () => {
        playerTurnIndex.value = playerTurnIndex.value >= scores.value.length - 1 ? 0 : playerTurnIndex.value + 1;
    };

    const randomizeMysteryCountry = () => {
        const countryOptions = Object.values(countryData);
        mysteryCountry.value = countryOptions[Math.floor(Math.random() * countryOptions.length)];
        incorrectGuesses.value = [];
        updatePointAwardingTable();
    }

    const updateSuggestionBox = () => {
        const show = guessing.value && query.value.length > 0;
        mapping.division.suggestionBox.style.visibility = show ? "visible" : "hidden";
    }

    const updatePointAwardingTable = () => {
        const pointAwardingTableRows = [...mapping.tableSection.pointAwardingTableBody.children];
        const index = pointAwardingTableRows.findIndex((_, i) => i === incorrectGuesses.value.length || (incorrectGuesses.value.length > 4 && i >= 4));
        for (let i = 0; i < pointAwardingTableRows.length; i++) {
            const row = pointAwardingTableRows[i] as HTMLTableRowElement;
            row.style.fontWeight = i === index ? "bold" : "normal";
            const [_, valueElement] = row.children;
            valueElement.textContent = `${pointMap[i]} Points`;
        }
        progress.value = (pointMap[index] / Math.max(...pointMap)).toFixed(2);
    };

    const startGame = () => {
        mapping.division.welcomePage.classList.add("removed");
        mapping.division.gamePage.classList.remove("removed");
        const playerCount = parseInt(mapping.input.playerCountInput.value);
        scores.value = new Array(playerCount).fill(0);
        playerTurnIndex.value = 0;
        randomizeMysteryCountry();
        updatePointAwardingTable();
    };

    suggestions.addChangeListener((suggestions) => {
        Dom.clear(mapping.division.suggestionBox);
        if (suggestions.length > 0) {
            mapping.division.suggestionBox.append(...suggestions.map((suggestion => Dom.create({
                tagName: "span",
                textContent: suggestion.name,
                eventListeners: {
                    mousedown: (event) => {
                        guess(suggestion);
                    }
                }
            }))));
        } else {
            mapping.division.suggestionBox.append(Dom.create({
                tagName: "span",
                textContent: `There are no countries named "${query.value}".`,
                classList: ["textColorNeutral", "fontStyleItalic"]
            }));
        }
    });

    guessing.addChangeListener(() => {
        updateSuggestionBox();
    });

    playerTurnIndex.addChangeListener((index) => {
        mapping.input.queryInput.placeholder = `Player ${index + 1}'s Guess`;
        mapping.heading.playerTurnDisplay.textContent = `Player ${index + 1}'s Turn`;
    });

    scores.addChangeListener((scores) => {
        Dom.clear(mapping.tableSection.scoresTableBody);
        mapping.tableSection.scoresTableBody.append(...scores.map((score, index) => Dom.create({
            tagName: "tr",
            childNodes: [
                Dom.create({
                    tagName: "td",
                    textContent: `Player ${index + 1}`
                }),
                Dom.create({
                    tagName: "td",
                    textContent: `${score} Points`
                })
            ]
        })));
    });

    mapping.button.playButton.addEventListener("mousedown", (event) => {
        startGame();
    });

    mapping.button.guessButton.addEventListener("mousedown", () => {
        if (suggestions.value.length > 0) {
            guess(suggestions.value[0]);
        }
    });

    mapping.button.forfeitButton.addEventListener("mousedown", () => {
        if (confirm("Are you sure you want to forfeit this round?")) {
            if (mysteryCountry.value !== null) {
                message.value = `You failed to guess the country ${mysteryCountry.value.name}.`;
            }
            randomizeMysteryCountry();
            nextPlayersTurn();
        }
    });

    mapping.button.abandonButton.addEventListener("mousedown", () => {
        if (confirm("Are you sure you want to abandon this game, and return to the main menu?")) {
            mapping.division.welcomePage.classList.remove("removed");
            mapping.division.gamePage.classList.add("removed");
        }
    });

    mapping.form.gameForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (suggestions.value.length > 0) {
            guess(suggestions.value[0]);
        }
    });

    query.addChangeListener((guess, oldGuess) => {
        const sorted = Object.values(countryData).sort((a, b) => (
            Text.Utility.getLevenshteinDistance(guess.toLowerCase(), a.name.substring(0, guess.length).toLowerCase()) -
            Text.Utility.getLevenshteinDistance(guess.toLowerCase(), b.name.substring(0, guess.length).toLowerCase())
        ));
        const newSuggestions = [];
        for (let i = 0; i < 5; i++) {
            const suggestion = sorted[i];
            const distance = Text.Utility.getLevenshteinDistance(guess.toLowerCase(), suggestion.name.substring(0, guess.length).toLowerCase());
            if (distance / guess.length < 0.5) {
                newSuggestions.push(suggestion);
            }
        }
        suggestions.value = newSuggestions;
        if (guess.length !== oldGuess.length && (guess.length === 0 || oldGuess.length === 0)) {
            updateSuggestionBox();
        }
    });

    mysteryCountry.addChangeListener((countryMeta) => {
        if (countryMeta !== null) {
            displayCountry(countryMeta, mapping);
        }
    });

    mapping.input.queryInput.focus();
});