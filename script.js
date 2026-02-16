

class Movie {
  #userRatings = [];

  constructor(data) {
    this.title = data.Title;
    this.year = data.Year;
    this.poster =
      data.Poster !== "N/A"
        ? data.Poster
        : "https://via.placeholder.com/400x600?text=No+Poster";
    this.plot = data.Plot;
    this.imdb = data.imdbRating;
    this.genre = data.Genre;
    this.addRating(Math.floor(Math.random() * 3) + 7);
  }

  addRating(score) {
    if (score >= 1 && score <= 10) this.#userRatings.push(score);
  }

  getAverageRating() {
    return (
      this.#userRatings.reduce((a, b) => a + b, 0) / this.#userRatings.length
    ).toFixed(1);
  }

  render() {
    return `
            <div class="movie-card">
                <img src="${this.poster}" alt="${this.title}" loading="lazy">
                <div class="info">
                    <span class="meta">⭐ ${this.imdb} | ${this.year}</span>
                    <h3>${this.title}</h3>
                    <p class="plot">${this.plot.substring(0, 100)}...</p>
                    <div class="user-avg">Community Score: ${this.getAverageRating()}</div>
                </div>
            </div>
        `;
  }
}

class ActionMovie extends Movie {
  render() {
    return super
      .render()
      .replace("movie-card", "movie-card action")
      .replace("</h3>", " <small>🔥</small></h3>");
  }
}

class ComedyMovie extends Movie {
  render() {
    return super
      .render()
      .replace("movie-card", "movie-card comedy")
      .replace("</h3>", " <small>😂</small></h3>");
  }
}

class CategorySection {
  constructor(title, movieTitles) {
    this.title = title;
    this.movieTitles = movieTitles;
  }

  async render(library) {
    const rowId = `row-${this.title.replace(/\s+/g, "")}`;
    const html = `
            <section class="section-row">
                <h2>${this.title}</h2>
                <button class="nav-btn left" id="btn-l-${rowId}">‹</button>
                <div class="row-container" id="${rowId}">
                    <div class="loader">✨ Loading...</div>
                </div>
                <button class="nav-btn right" id="btn-r-${rowId}">›</button>
            </section>
        `;

    document
      .getElementById("movieSections")
      .insertAdjacentHTML("beforeend", html);

    const container = document.getElementById(rowId);
    document.getElementById(`btn-l-${rowId}`).onclick = () =>
      container.scrollBy({ left: -500, behavior: "smooth" });
    document.getElementById(`btn-r-${rowId}`).onclick = () =>
      container.scrollBy({ left: 500, behavior: "smooth" });

    const moviePromises = this.movieTitles.map((t) => library.fetchData(t));
    const movieObjects = await Promise.all(moviePromises);

    container.innerHTML = "";
    movieObjects.forEach((obj) => {
      if (obj) container.innerHTML += obj.render();
    });
  }
}

class MovieApp {
  constructor() {
    this.init();
  }

  async fetchData(title) {
    try {
      const url = `/api/fetchMovie?title=${encodeURIComponent(title)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.Response === "True") {
        if (data.Genre.includes("Action")) return new ActionMovie(data);
        if (data.Genre.includes("Comedy")) return new ComedyMovie(data);
        return new Movie(data);
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  }

  init() {
    const themeCheckbox = document.getElementById("themeCheckbox");
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("movieInput");

    themeCheckbox.addEventListener("change", () => {
      const theme = themeCheckbox.checked ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);
    });

    const performSearch = async () => {
      const query = searchInput.value.trim();
      if (!query) return;

      document.getElementById("movieSections").innerHTML = `
                <div style="padding: 20px 5%;">
                    <button onclick="location.reload()" style="background:none; border:1px solid var(--accent); color:var(--accent); padding:10px 20px; border-radius:30px; cursor:pointer;">← Back to Library</button>
                </div>
            `;
      const searchRow = new CategorySection("Search Result", [query]);
      await searchRow.render(this);
    };

    searchBtn.onclick = performSearch;
    searchInput.onkeypress = (e) => {
      if (e.key === "Enter") performSearch();
    };

    const categories = [
      new CategorySection("Trending Blockbusters", [
        "Inception",
        "The Dark Knight",
        "Dune",
        "Interstellar",
        "The Matrix",
        "Avatar",
        "Tenet",
      ]),
      new CategorySection("Action Adrenaline", [
        "John Wick",
        "Gladiator",
        "Mad Max: Fury Road",
        "Die Hard",
        "Top Gun: Maverick",
        "Extraction",
      ]),
      new CategorySection("Comedy Gold", [
        "Superbad",
        "The Hangover",
        "Deadpool",
        "Free Guy",
        "Step Brothers",
        "21 Jump Street",
      ]),
    ];

    categories.forEach((cat) => cat.render(this));
  }
}

const cineLib = new MovieApp();