/**
 * 🎬 CineLibrary: OOP Movie Management System
 * Concepts: Classes, Inheritance, Private Fields, and Polymorphism
 */

// --- 1. THE DATA MODELS (Inheritance) ---

class Movie {
  #userRatings = []; // Private field for ratings

  constructor(data) {
    this.title = data.Title;
    this.year = data.Year;
    this.poster =
      data.Poster !== "N/A"
        ? data.Poster
        : "https://via.placeholder.com/200x300?text=No+Poster";
    this.plot = data.Plot;
    this.genre = data.Genre;
    this.imdbRating = data.imdbRating;

    // Add a default random rating to the private field for the OOP demo
    this.addRating(Math.floor(Math.random() * 3) + 7);
  }

  addRating(score) {
    if (score >= 1 && score <= 10) this.#userRatings.push(score);
  }

  getAverageRating() {
    if (this.#userRatings.length === 0) return "N/A";
    const sum = this.#userRatings.reduce((a, b) => a + b, 0);
    return (sum / this.#userRatings.length).toFixed(1);
  }

  // Base rendering method
  render() {
    return `
            <div class="movie-card">
                <img src="${this.poster}" alt="${this.title}">
                <div class="info">
                    <h3>${this.title}</h3>
                    <div class="meta">
                        <span class="score">⭐ ${this.imdbRating}</span>
                        <span class="year">${this.year}</span>
                    </div>
                    <p class="plot-snippet">${this.plot.substring(0, 60)}...</p>
                    <div class="user-avg">Community: ${this.getAverageRating()}</div>
                </div>
            </div>
        `;
  }
}

// Inheritance: Specialized Action Class
class ActionMovie extends Movie {
  render() {
    // Polymorphism: Adding a unique class and a "High Octane" badge
    return super
      .render()
      .replace("movie-card", "movie-card action")
      .replace("</h3>", " <small>🔥</small></h3>");
  }
}

// Inheritance: Specialized Comedy Class
class ComedyMovie extends Movie {
  render() {
    // Polymorphism: Adding a unique class and a "Laugh" badge
    return super
      .render()
      .replace("movie-card", "movie-card comedy")
      .replace("</h3>", " <small>😂</small></h3>");
  }
}

// --- 2. THE UI COMPONENTS (Composition) ---

class CategorySection {
  constructor(title, movieTitles) {
    this.title = title;
    this.movieTitles = movieTitles;
  }

  async render(libraryInstance) {
    const sectionId = `row-${this.title.replace(/\s+/g, "")}`;
    const html = `
            <section class="section-row">
                <h2>${this.title}</h2>
                <div class="row-container" id="${sectionId}">
                    <div class="loader">Loading...</div>
                </div>
            </section>
        `;

    document
      .getElementById("movieSections")
      .insertAdjacentHTML("beforeend", html);
    const container = document.getElementById(sectionId);

    // Fetch all movies for this row
    const movieObjects = await Promise.all(
      this.movieTitles.map((t) => libraryInstance.fetchMovieData(t)),
    );

    container.innerHTML = ""; // Clear loader
    movieObjects.forEach((movie) => {
      if (movie) container.innerHTML += movie.render();
    });
  }
}

// --- 3. THE MAIN APP CONTROLLER ---

class MovieLibrary {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.sectionContainer = document.getElementById("movieSections");
    this.searchInput = document.getElementById("movieInput");
    this.searchBtn = document.getElementById("searchBtn");

    this.init();
  }

  async fetchMovieData(title) {
    try {
      const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.Response === "True") {
        // Determine which class to instantiate (Factory Logic)
        if (data.Genre.includes("Action")) return new ActionMovie(data);
        if (data.Genre.includes("Comedy")) return new ComedyMovie(data);
        return new Movie(data);
      }
    } catch (err) {
      console.error("API Error:", err);
    }
    return null;
  }

  async handleSearch() {
    const query = this.searchInput.value.trim();
    if (!query) return;

    this.sectionContainer.innerHTML = ""; // Clear the grid for search results
    const searchSection = new CategorySection("Search Results", [query]);
    await searchSection.render(this);

    // Add a "Back" button to restore defaults
    this.sectionContainer.insertAdjacentHTML(
      "afterbegin",
      `<button onclick="location.reload()" class="back-btn">← Back to Library</button>`,
    );
  }

  async init() {
    // 1. Setup Event Listeners
    this.searchBtn.addEventListener("click", () => this.handleSearch());
    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleSearch();
    });

    // 2. Define Netflix-style Categories
    const categories = [
      new CategorySection("Trending Now", [
        "Inception",
        "The Dark Knight",
        "Interstellar",
        "The Prestige",
      ]),
      new CategorySection("Action Adrenaline", [
        "John Wick",
        "Mad Max: Fury Road",
        "Die Hard",
        "Gladiator",
      ]),
      new CategorySection("Comedy Hits", [
        "Superbad",
        "The Hangover",
        "Mean Girls",
        "Step Brothers",
      ]),
      new CategorySection("Drama & Adventure", [
        "The Shawshank Redemption",
        "Life of Pi",
        "The Revenant",
        "Dune",
      ]),
    ];

    // 3. Render all rows
    for (const cat of categories) {
      await cat.render(this);
    }
  }
}

// --- 4. START THE APP ---
const API_KEY = "398a29f2"; // 👈 Replace with your real OMDb API key
const myApp = new MovieLibrary(API_KEY);
