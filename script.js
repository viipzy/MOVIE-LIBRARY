class Modal {
  static open(movieData) {
    const movie = JSON.parse(decodeURIComponent(movieData));
    const trailerUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(movie.title + " official trailer")}`;
    const html = `
            <div class="modal-overlay" id="modalOverlay" onclick="Modal.close()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <iframe src="${trailerUrl}" allowfullscreen></iframe>
                    <div class="details">
                        <h2>${movie.title}</h2>
                        <p style="color:var(--accent)">${movie.genre} | ${movie.year}</p>
                        <p>${movie.plot}</p>
                    </div>
                </div>
            </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    setTimeout(
      () => document.getElementById("modalOverlay").classList.add("active"),
      10,
    );
  }
  static close() {
    const m = document.getElementById("modalOverlay");
    if (m) {
      m.classList.remove("active");
      setTimeout(() => m.remove(), 300);
    }
  }
}

class Movie {
  constructor(data) {
    this.title = data.Title;
    this.year = data.Year;
    this.poster =
      data.Poster !== "N/A"
        ? data.Poster
        : "https://via.placeholder.com/400x600";
    this.plot = data.Plot;
    this.imdb = data.imdbRating;
    this.genre = data.Genre;
  }
  static isFav(title) {
    return (JSON.parse(localStorage.getItem("myList")) || []).includes(title);
  }
  render() {
    const isFav = Movie.isFav(this.title);
    const movieJson = encodeURIComponent(JSON.stringify(this));
    return `
            <div class="movie-card" onclick="Modal.open('${movieJson}')">
                <button class="favorite-btn ${isFav ? "active" : ""}" onclick="event.stopPropagation(); cineLib.toggleFav('${this.title.replace(/'/g, "\\'")}')">
                    ${isFav ? "❤️" : "🤍"}
                </button>
                <img src="${this.poster}" alt="${this.title}">
                <div class="info">
                    <h3>${this.title}</h3>
                    <p>⭐ ${this.imdb}</p>
                </div>
            </div>`;
  }
}

class ActionMovie extends Movie {
  render() {
    return super.render().replace("movie-card", "movie-card action");
  }
}
class SciFiMovie extends Movie {
  render() {
    return super.render().replace("movie-card", "movie-card sci-fi");
  }
}

class CategorySection {
  constructor(title, titles, isFav = false) {
    this.title = title;
    this.titles = titles;
    this.isFav = isFav;
  }
  async render(app) {
    if (this.isFav && this.titles.length === 0) return;
    const id = `row-${this.title.replace(/\s+/g, "")}`;
    const html = `
            <section class="section-row">
                <h2>${this.title}</h2>
                <button class="nav-btn left" onclick="document.getElementById('${id}').scrollBy({left:-500,behavior:'smooth'})">‹</button>
                <div class="row-container" id="${id}">${Array(6).fill('<div class="skeleton-card"></div>').join("")}</div>
                <button class="nav-btn right" onclick="document.getElementById('${id}').scrollBy({left:500,behavior:'smooth'})">›</button>
            </section>`;
    document
      .getElementById("movieSections")
      .insertAdjacentHTML(this.isFav ? "afterbegin" : "beforeend", html);
    const objs = await Promise.all(this.titles.map((t) => app.fetchData(t)));
    document.getElementById(id).innerHTML = objs
      .map((o) => (o ? o.render() : ""))
      .join("");
  }
}

class MovieApp {
  async fetchData(t) {
    const res = await fetch(`/api/fetchMovie?title=${encodeURIComponent(t)}`);
    const d = await res.json();
    if (d.Response === "True") {
      if (d.Genre.includes("Action")) return new ActionMovie(d);
      if (d.Genre.includes("Sci-Fi")) return new SciFiMovie(d);
      return new Movie(d);
    }
  }
  toggleFav(t) {
    let l = JSON.parse(localStorage.getItem("myList")) || [];
    l.includes(t) ? (l = l.filter((i) => i !== t)) : l.push(t);
    localStorage.setItem("myList", JSON.stringify(l));
    this.load();
  }
  load() {
    document.getElementById("movieSections").innerHTML = "";
    const favs = JSON.parse(localStorage.getItem("myList")) || [];
    [
      new CategorySection("My List", favs, true),
      new CategorySection("Hits", [
        "Dune: Part Two",
        "Deadpool & Wolverine",
        "Oppenheimer",
        "Gladiator II",
        "Furiosa",
      ]),
      new CategorySection("Action", [
        "John Wick: Chapter 4",
        "The Fall Guy",
        "Top Gun: Maverick",
      ]),
      new CategorySection("Sci-Fi", [
        "Interstellar",
        "Arrival",
        "Tenet",
        "Blade Runner 2049",
      ]),
    ].forEach((c) => c.render(this));
  }
  init() {
    document.getElementById("themeCheckbox").onchange = (e) =>
      document.documentElement.setAttribute(
        "data-theme",
        e.target.checked ? "dark" : "light",
      );
    document.getElementById("searchBtn").onclick = () => {
      const q = document.getElementById("movieInput").value;
      if (q) {
        document.getElementById("movieSections").innerHTML = "";
        new CategorySection("Results", [q]).render(this);
      }
    };
    this.load();
  }
}
const cineLib = new MovieApp();
