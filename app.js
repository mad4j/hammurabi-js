// Game state
let gameState = {
    year: 1,
    population: 100,
    acres: 1000,
    bushels: 2800,
    acrePrice: 19,
    gameOver: false,
    totalDeaths: 0,
    plagueYear: false
};

// PWA functionality
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block';
});

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                installBtn.style.display = 'none';
            }
            deferredPrompt = null;
        });
    }
}

// Game functions
function updateDisplay() {
    document.getElementById('year').textContent = gameState.year;
    document.getElementById('population').textContent = gameState.population;
    document.getElementById('acres').textContent = gameState.acres;
    document.getElementById('bushels').textContent = gameState.bushels;
    document.getElementById('acre-price').textContent = gameState.acrePrice;
    
    updateSliderLimits();
}

function updateSliderLimits() {
    // Calculate maximum values for sliders
    const maxBuyAcres = Math.floor(gameState.bushels / gameState.acrePrice);
    const maxSellAcres = gameState.acres;
    const maxFeedPeople = gameState.bushels;
    const maxPlantAcres = gameState.acres;

    // Update buy acres slider
    const buySlider = document.getElementById('buy-acres');
    buySlider.max = maxBuyAcres;
    document.getElementById('max-buy-acres').textContent = maxBuyAcres;
    document.getElementById('buy-acres-value').textContent = buySlider.value;

    // Update sell acres slider
    const sellSlider = document.getElementById('sell-acres');
    sellSlider.max = maxSellAcres;
    document.getElementById('max-sell-acres').textContent = maxSellAcres;
    document.getElementById('sell-acres-value').textContent = sellSlider.value;

    // Update feed people slider
    const feedSlider = document.getElementById('feed-people');
    feedSlider.max = maxFeedPeople;
    document.getElementById('max-feed-people').textContent = maxFeedPeople;
    document.getElementById('feed-people-value').textContent = feedSlider.value;

    // Update plant acres slider
    const plantSlider = document.getElementById('plant-acres');
    plantSlider.max = maxPlantAcres;
    document.getElementById('max-plant-acres').textContent = maxPlantAcres;
    document.getElementById('plant-acres-value').textContent = plantSlider.value;
}

function updateSliderValue(sliderId) {
    const slider = document.getElementById(sliderId);
    const valueDisplay = document.getElementById(sliderId + '-value');
    
    if (slider && valueDisplay) {
        valueDisplay.textContent = slider.value;
        
        // Update dependent sliders for resource management
        if (sliderId === 'buy-acres' || sliderId === 'sell-acres' || sliderId === 'feed-people') {
            updateDependentSliders();
        }
    }
}

function setupSliderEvents() {
    // This function is now less critical since we use inline handlers
    // but we keep it for any additional setup if needed
}

function updateDependentSliders() {
    const buyAcres = parseInt(document.getElementById('buy-acres').value) || 0;
    const sellAcres = parseInt(document.getElementById('sell-acres').value) || 0;
    const feedPeople = parseInt(document.getElementById('feed-people').value) || 0;

    // Calculate remaining resources
    const acresAfterTrade = gameState.acres + buyAcres - sellAcres;
    const bushelsAfterPurchases = gameState.bushels - (buyAcres * gameState.acrePrice) + (sellAcres * gameState.acrePrice) - feedPeople;

    // Update plant acres slider based on available acres and bushels for seeds
    const maxPlantFromAcres = Math.max(0, acresAfterTrade);
    const maxPlantFromBushels = Math.max(0, Math.floor(bushelsAfterPurchases / 0.5));
    const maxPlantAcres = Math.min(maxPlantFromAcres, maxPlantFromBushels);

    const plantSlider = document.getElementById('plant-acres');
    plantSlider.max = maxPlantAcres;
    document.getElementById('max-plant-acres').textContent = maxPlantAcres;
    
    // Reset plant acres if it exceeds new maximum
    if (parseInt(plantSlider.value) > maxPlantAcres) {
        plantSlider.value = maxPlantAcres;
        document.getElementById('plant-acres-value').textContent = maxPlantAcres;
    }
}

function addMessage(text, isImportant = false) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    if (isImportant) {
        messageDiv.style.background = 'rgba(139, 69, 19, 0.2)';
        messageDiv.style.fontWeight = 'bold';
    }
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Keep only last 5 messages
    while (messagesDiv.children.length > 5) {
        messagesDiv.removeChild(messagesDiv.firstChild);
    }
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nextTurn() {
    if (gameState.gameOver) return;

    // Get player inputs
    const buyAcres = parseInt(document.getElementById('buy-acres').value) || 0;
    const sellAcres = parseInt(document.getElementById('sell-acres').value) || 0;
    const feedPeople = parseInt(document.getElementById('feed-people').value) || 0;
    const plantAcres = parseInt(document.getElementById('plant-acres').value) || 0;

    // Validate inputs
    if (buyAcres * gameState.acrePrice > gameState.bushels) {
        addMessage("You don't have enough bushels to buy that much land!");
        return;
    }

    if (sellAcres > gameState.acres) {
        addMessage("You don't have that many acres to sell!");
        return;
    }

    if (feedPeople > gameState.bushels - (buyAcres * gameState.acrePrice)) {
        addMessage("You don't have enough bushels to feed that many people!");
        return;
    }

    const acresAfterTrade = gameState.acres + buyAcres - sellAcres;
    if (plantAcres > acresAfterTrade) {
        addMessage("You don't have enough acres to plant!");
        return;
    }

    const bushelsCost = (buyAcres * gameState.acrePrice) + feedPeople + (plantAcres * 0.5);
    if (bushelsCost > gameState.bushels) {
        addMessage("You don't have enough bushels for all these actions!");
        return;
    }

    // Execute turn
    gameState.acres = acresAfterTrade;
    gameState.bushels = gameState.bushels - (buyAcres * gameState.acrePrice) + (sellAcres * gameState.acrePrice) - feedPeople - Math.floor(plantAcres * 0.5);

    // Calculate harvest
    const yield = random(1, 5);
    const harvest = plantAcres * yield;
    gameState.bushels += harvest;

    addMessage(`Harvest: ${harvest} bushels from ${plantAcres} acres (${yield} bushels per acre)`);

    // Calculate population changes
    const peopleFed = Math.floor(feedPeople / 20);
    const starved = Math.max(0, gameState.population - peopleFed);
    
    if (starved > 0) {
        gameState.totalDeaths += starved;
        addMessage(`${starved} people starved to death!`, true);
    }

    gameState.population -= starved;

    // Check for plague
    gameState.plagueYear = random(1, 100) <= 15;
    if (gameState.plagueYear) {
        const plagueDeaths = Math.floor(gameState.population / 2);
        gameState.population -= plagueDeaths;
        gameState.totalDeaths += plagueDeaths;
        addMessage(`A horrible plague strikes! ${plagueDeaths} people died!`, true);
    }

    // Immigration
    if (starved === 0 && !gameState.plagueYear) {
        const immigrants = random(1, 5) + Math.floor((20 * gameState.acres + gameState.bushels) / gameState.population / 100) + 1;
        gameState.population += immigrants;
        addMessage(`${immigrants} people came to the city`);
    }

    // Rat damage
    const ratDamage = random(0, Math.floor(gameState.bushels / 3));
    gameState.bushels -= ratDamage;
    if (ratDamage > 0) {
        addMessage(`Rats ate ${ratDamage} bushels`);
    }

    // Update acre price for next year
    gameState.acrePrice = random(17, 26);
    gameState.year++;

    // Check game over conditions
    if (gameState.year > 10) {
        endGame();
        return;
    }

    if (gameState.population <= 0) {
        gameOver("Your population has died out! Your reign ends in failure.");
        return;
    }

    if (starved > gameState.population * 0.45) {
        gameOver("You starved too many people! The citizens revolt and overthrow you!");
        return;
    }

    // Reset sliders
    document.getElementById('buy-acres').value = 0;
    document.getElementById('sell-acres').value = 0;
    document.getElementById('feed-people').value = 0;
    document.getElementById('plant-acres').value = 0;

    updateDisplay();
}

function endGame() {
    gameState.gameOver = true;
    const acresPerPerson = gameState.acres / gameState.population;
    let rating;

    if (gameState.totalDeaths > 0.33 * gameState.population || acresPerPerson < 7) {
        rating = "Your performance was terrible! You're thrown out of office!";
    } else if (gameState.totalDeaths > 0.1 * gameState.population || acresPerPerson < 9) {
        rating = "Your performance was mediocre. A less than stellar reign.";
    } else if (gameState.totalDeaths > 0.03 * gameState.population || acresPerPerson < 10) {
        rating = "Your performance was good. The people are satisfied with your rule.";
    } else {
        rating = "Outstanding! You are a great ruler! Your people worship you!";
    }

    victory(`After 10 years of rule: Population: ${gameState.population}, Acres: ${gameState.acres}, Deaths: ${gameState.totalDeaths}. ${rating}`);
}

function gameOver(message) {
    gameState.gameOver = true;
    const gameBoard = document.querySelector('.game-board');
    const gameOverDiv = document.createElement('div');
    gameOverDiv.className = 'game-over';
    gameOverDiv.innerHTML = `
        <h2>💀 GAME OVER 💀</h2>
        <p>${message}</p>
        <button class="btn" onclick="location.reload()" style="margin-top: 20px; width: auto;">Play Again</button>
    `;
    gameBoard.appendChild(gameOverDiv);
    document.getElementById('controls').style.display = 'none';
}

function victory(message) {
    const gameBoard = document.querySelector('.game-board');
    const victoryDiv = document.createElement('div');
    victoryDiv.className = 'victory';
    victoryDiv.innerHTML = `
        <h2>👑 REIGN COMPLETE 👑</h2>
        <p>${message}</p>
        <button class="btn" onclick="location.reload()" style="margin-top: 20px; width: auto;">Play Again</button>
    `;
    gameBoard.appendChild(victoryDiv);
    document.getElementById('controls').style.display = 'none';
}

// Service Worker registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('data:text/javascript;base64,' + btoa(`
        const CACHE_NAME = 'hammurabi-v1';
        const urlsToCache = ['./'];

        self.addEventListener('install', event => {
            event.waitUntil(
                caches.open(CACHE_NAME)
                .then(cache => cache.addAll(urlsToCache))
            );
        });

        self.addEventListener('fetch', event => {
            event.respondWith(
                caches.match(event.request)
                .then(response => response || fetch(event.request))
            );
        });
    `)).catch(err => console.log('Service worker registration failed'));
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    updateDisplay();
    setupSliderEvents();
    addMessage("Welcome, O King! You rule the city of Babylon. Make wise decisions to keep your people fed and your kingdom prosperous!");
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'loading') {
    // Do nothing, wait for DOMContentLoaded
} else {
    // DOM is already ready
    updateDisplay();
    setupSliderEvents();
    addMessage("Welcome, O King! You rule the city of Babylon. Make wise decisions to keep your people fed and your kingdom prosperous!");
}