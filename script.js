const apiKey = "cdc48326020d9bb25f8f2dd88a0aa33b";

// City IDs for the three cities you want to display weather information for
const cityIds = ["292223", "5341145", "5317058"];

// Fetch weather data for each city and update the respective elements
async function fetchWeatherData() {
  for (let i = 0; i < cityIds.length; i++) {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?id=${cityIds[i]}&appid=${apiKey}&units=metric`
    );
    const data = await response.json();
    updateWeatherData(i + 1, data);
  }
}

// Update the weather data on the page
function updateWeatherData(cityNumber, data) {
  const weatherInfoElement = document.getElementById(
    `weatherInfo${cityNumber}`
  );
  weatherInfoElement.textContent = `${data.weather[0].main} (${data.main.temp}°C)`;
  // Add code to update the weather icon using the 'weatherIconElement'
}

// Call the function to fetch and update weather data on page load
fetchWeatherData();

window.addEventListener("scroll", () => {
  const backToTop = document.getElementById("back-to-top");
  if (window.scrollY > 300) {
    backToTop.classList.add("show"); // Add the 'show' class
    backToTop.classList.remove("hide"); // Remove the 'hide' class
  } else {
    backToTop.classList.add("hide"); // Add the 'hide' class
    backToTop.classList.remove("show"); // Remove the 'show' class
  }
});
