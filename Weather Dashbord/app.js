// API Configuration
const API_KEY = 'dc99f1505e0a41c583380537253006'; 
const BASE_URL = 'https://api.weatherapi.com/v1';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const themeBtn = document.getElementById('theme-btn');
const currentWeatherDiv = document.getElementById('current-weather');
const forecastDiv = document.getElementById('forecast');
const weatherBg = document.getElementById('weather-bg');
const windCard = document.getElementById('wind-card');
const humidityCard = document.getElementById('humidity-card');
const uvCard = document.getElementById('uv-card');
const visibilityCard = document.getElementById('visibility-card');

// Default city
let currentCity = 'New York';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    }
    
    fetchWeatherData(currentCity);
});

// Event listeners
searchBtn.addEventListener('click', searchWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});
locationBtn.addEventListener('click', getLocationWeather);
themeBtn.addEventListener('click', toggleTheme);

// Search weather for a city
function searchWeather() {
    const city = cityInput.value.trim();
    if (city) {
        currentCity = city;
        fetchWeatherData(city);
        cityInput.value = '';
    }
}

// Get weather for current location
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherData(`${latitude},${longitude}`);
            },
            (error) => {
                console.error('Geolocation error:', error);
                showError('Unable to retrieve your location');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser');
    }
}

// Toggle dark/light theme
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    if (document.body.classList.contains('dark-theme')) {
        localStorage.setItem('theme', 'dark');
        themeBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    } else {
        localStorage.setItem('theme', 'light');
        themeBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }
}

// Fetch weather data from API
async function fetchWeatherData(query) {
    try {
        showLoading();
        
        // Fetch current weather and forecast
        const [currentResponse, forecastResponse] = await Promise.all([
            fetch(`${BASE_URL}/current.json?key=${API_KEY}&q=${query}&aqi=no`),
            fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${query}&days=5&aqi=no&alerts=no`)
        ]);
        
        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('Weather data not available');
        }
        
        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        
        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        updateBackground(currentData.current.condition.code);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Failed to load weather data. Please try again.');
    }
}

// Display current weather
function displayCurrentWeather(data) {
    const { location, current } = data;
    const { name, country, localtime } = location;
    const { 
        temp_c, 
        condition, 
        humidity, 
        wind_kph, 
        feelslike_c, 
        uv, 
        vis_km,
        pressure_mb,
        gust_kph
    } = current;
    const { text, icon, code } = condition;
    const date = new Date(localtime);

    currentWeatherDiv.innerHTML = `
        <div class="location-info">
            <h2 class="location-name">${name}, ${country}</h2>
            <p class="location-date">${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="weather-display">
            <div class="temperature">${Math.round(temp_c)}</div>
            <div class="weather-condition">
                <img src="${icon.replace('64x64', '128x128')}" alt="${text}" class="weather-icon">
                <p class="condition-text">${text}</p>
                <p class="feels-like">Feels like ${Math.round(feelslike_c)}°C</p>
            </div>
        </div>
    `;

    // Update highlight cards
    windCard.querySelector('.value').textContent = `${wind_kph} km/h`;
    humidityCard.querySelector('.value').textContent = `${humidity}%`;
    uvCard.querySelector('.value').textContent = uv;
    visibilityCard.querySelector('.value').textContent = `${vis_km} km`;
}

// Display 5-day forecast
function displayForecast(data) {
    const { forecast } = data;
    const forecastDays = forecast.forecastday;

    forecastDiv.innerHTML = forecastDays.map(day => {
        const date = new Date(day.date);
        const { maxtemp_c, mintemp_c, avgtemp_c, daily_chance_of_rain, condition } = day.day;
        const { text, icon } = condition;

        return `
            <div class="forecast-day">
                <h4 class="day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</h4>
                <p class="date">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                <img src="${icon}" alt="${text}" class="weather-icon">
                <div class="temp">${Math.round(avgtemp_c)}°C</div>
                <p class="condition">${text}</p>
                <div class="temp-range">
                    <span class="max">H: ${Math.round(maxtemp_c)}°C</span>
                    <span class="min">L: ${Math.round(mintemp_c)}°C</span>
                </div>
                <div class="rain-chance">
                    <i class="fas fa-umbrella"></i> ${daily_chance_of_rain}%
                </div>
            </div>
        `;
    }).join('');
}

// Update background based on weather condition
function updateBackground(weatherCode) {
    // Clear previous classes
    weatherBg.className = '';
    
    // Add base class
    weatherBg.classList.add('weather-bg');
    
    // Determine weather type and add appropriate class
    if (weatherCode === 1000) {
        weatherBg.classList.add('sunny');
    } else if (weatherCode >= 1003 && weatherCode <= 1009) {
        weatherBg.classList.add('cloudy');
    } else if (weatherCode >= 1030 && weatherCode <= 1282) {
        weatherBg.classList.add('rainy');
    } else if (weatherCode >= 1063 && weatherCode <= 1237) {
        weatherBg.classList.add('snowy');
    } else {
        weatherBg.classList.add('default');
    }
}

// Show loading state
function showLoading() {
    currentWeatherDiv.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading weather data...</p>
        </div>
    `;
    
    forecastDiv.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading forecast data...</p>
        </div>
    `;
}

// Show error message
function showError(message) {
    currentWeatherDiv.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

