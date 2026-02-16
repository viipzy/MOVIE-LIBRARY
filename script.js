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
  static isFavorited(title) {
    const list = JSON.parse(localStorage.getItem("myList")) || [];
    return list.includes(title);
  }
  render() {
    const isFav = Movie.isFavorited(this.title);
    return `
            <div class="movie-card">
                <button class="favorite-btn ${isFav ? "active" : ""}" onclick="event.stopPropagation(); cineLib.toggleFav('${this.title.replace(/'/g, "\\'")}')">
                    ${isFav ? "❤️" : "🤍"}
                </button>
                <img src="${this.poster}" alt="${this.title}" loading="lazy">
                <div class="info">
                    <span class="meta">⭐ ${this.imdb} | ${this.year}</span>
                    <h3>${this.title}</h3>
                    <p class="plot">${this.plot.substring(0, 100)}...</p>
                    <div class="user-avg">Score: ${this.getAverageRating()}</div>
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

class SciFiMovie extends Movie {
  render() {
    return super
      .render()
      .replace("movie-card", "movie-card sci-fi")
      .replace("</h3>", " <small>🚀</small></h3>");
  }
}

class CategorySection {
  constructor(title, movieTitles, isFavSection = false) {
    this.title = title;
    this.movieTitles = movieTitles;
    this.isFavSection = isFavSection;
  }

  renderSkeletons() {
    return Array(6).fill('<div class="skeleton-card"></div>').join("");
  }

  async render(library) {
    if (this.isFavSection && this.movieTitles.length === 0) return;
    const rowId = `row-${this.title.replace(/\s+/g, "")}`;
    const html = `
            <section class="section-row" id="section-${rowId}">
                <h2>${this.title}</h2>
                <button class="nav-btn left" id="btn-l-${rowId}">‹</button>
                <div class="row-container" id="${rowId}">${this.renderSkeletons()}</div>
                <button class="nav-btn right" id="btn-r-${rowId}">›</button>
            </section>
        `;
    document
      .getElementById("movieSections")
      .insertAdjacentHTML(this.isFavSection ? "afterbegin" : "beforeend", html);

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
        if (data.Genre.includes("Sci-Fi")) return new SciFiMovie(data);
        return new Movie(data);
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  }
  toggleFav(title) {
    let list = JSON.parse(localStorage.getItem("myList")) || [];
    list.includes(title)
      ? (list = list.filter((t) => t !== title))
      : list.push(title);
    localStorage.setItem("myList", JSON.stringify(list));
    document.getElementById("movieSections").innerHTML = "";
    this.loadContent();
  }
  loadContent() {
    const favs = JSON.parse(localStorage.getItem("myList")) || [];
    const categories = [
      new CategorySection("My List", favs, true),
      new CategorySection("2024/25 Blockbusters", [
        "Dune: Part Two",
        "Deadpool & Wolverine",
        "Oppenheimer",
        "Gladiator II",
        "Furiosa",
        "Kingdom of the Planet of the Apes",
      ]),
      new CategorySection("High-Octane Action", [
        "John Wick: Chapter 4",
        "Mission: Impossible - Dead Reckoning",
        "The Fall Guy",
        "Monkey Man",
        "Top Gun: Maverick",
      ]),
      new CategorySection("Mind-Bending Sci-Fi", [
        "Interstellar",
        "Everything Everywhere All at Once",
        "Arrival",
        "Tenet",
        "The Creator",
        "Blade Runner 2049",
      ]),
    ];
    categories.forEach((cat) => cat.render(this));
  }
  init() {
    document.getElementById("themeCheckbox").addEventListener("change", (e) => {
      document.documentElement.setAttribute(
        "data-theme",
        e.target.checked ? "dark" : "light",
      );
    });
    document.getElementById("searchBtn").onclick = async () => {
      const query = document.getElementById("movieInput").value.trim();
      if (!query) return;
      document.getElementById("movieSections").innerHTML =
        `<div style="padding: 20px 5%;"><button onclick="location.reload()" class="back-btn">← Back</button></div>`;
      await new CategorySection("Search Results", [query]).render(this);
    };
    this.loadContent();
  }
}
const cineLib = new MovieApp();
