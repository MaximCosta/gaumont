function minutesToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 60);
    var m = Math.floor(d % 60);

    var hDisplay = h > 0 ? h : "";
    var mDisplay = m > 0 ? m : "";
    return `(${hDisplay}h${mDisplay})`;
}

function setQueryStringParameter(name, value) {
    const params = new URLSearchParams(window.location.search);
    params.set(name, value);
    window.history.replaceState({}, "", decodeURIComponent(`${window.location.pathname}?${params}`));
}

function hasParentClass(child, classname) {
    if (child.className.split(" ").indexOf(classname) >= 0) return child;
    try {
        return child.parentNode && hasParentClass(child.parentNode, classname);
    } catch (TypeError) {
        return false;
    }
}

function removeTime(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

async function citiesShows(cine) {
    document.querySelector(".cur-city").innerHTML = cine.replace(/-/g, " ");
    let cities_div = document.querySelector(".cities-shows");
    let cities = await fetch("/cities").then((res) => res.json());

    let find = cities.find((city) => city.cinemas.includes(cine));
    if (!find) return (window.location.href = "/");

    for (let city of cities) {
        let city_div = document.createElement("div");
        city_div.classList.add("city");
        city_div.classList.add("show");
        city_div.setAttribute("data-city", city.slug);
        city_div.innerHTML = `
        <div class="city-name">
            <div>
                <h4>${city.name}</h4>
                <span>${city.cinemaCount} cinéma(s)</span>
            </div>
            <div class="city-cbtn po">
                <i class="fa-solid fa-chevron-right"></i>
            </div>
        </div>
        <div class="city-cinema">
            ${city.cinemas.map((cine) => `<div class="cinema-name" data-cinema="${cine}">${cine.replace(/-/g, " ")}<i class="fa-solid fa-arrow-up-right-from-square po link-city"></i></div>`).join("")}
        </div>`;
        cities_div.appendChild(city_div);
    }
}

window.addEventListener(
    "message",
    (ev) => {
        let iFrameID = document.getElementById("idIframe");
        if (ev.data.type && ev.data.type === "resize-iframe") {
            iFrameID.style.width = ev.data.payload.width + "px";
            iFrameID.style.height = ev.data.payload.height + "px";
        }
    },
    false
);

async function printMovie() {
    let movies_div = document.querySelector(".card-container");
    let selected_date = document.querySelector(".card-date.active");
    let filter = document.querySelector(".search-bar").value;
    let idx = 0;

    movies_div.innerHTML = "";
    for (let movie of window.global_movies) {
        if (filter && !movie.title.toLowerCase().includes(filter.toLowerCase())) continue;
        let card = document.createElement("div");
        let tmp = document.querySelector(".template_card").content.cloneNode(true);

        card.classList.add("card");
        tmp.querySelector("img").src = movie.img;
        tmp.querySelector(".card-title").innerHTML = movie.title;
        tmp.querySelector(".card-subtitle").innerHTML = movie.subtitle;
        card.appendChild(tmp);

        for (date of movie.dates) {
            if (selected_date.textContent !== date.date) continue;
            let subcard = document.createElement("div");
            let tmp_subcard = document.querySelector(".template_subcard").content.cloneNode(true);
            subcard.classList.add("card-subcard");
            subcard.setAttribute("id_cine", date.id_cine);
            subcard.setAttribute("id_movie", date.id_movie);
            tmp_subcard.querySelector(".card-title").innerHTML = date.hour;
            subcard.appendChild(tmp_subcard);
            card.querySelector(".card-movie").appendChild(subcard);
        }
        if (card.querySelector(".card-movie").children.length > 0) {
            movies_div.appendChild(card);
            setTimeout(() => {
                card.classList.add("show");
            }, 100 * (idx + 1));
            idx++;
        }
    }
}

async function printCities() {
    let filter = document.querySelector(".search-input").value;
    document.querySelector(".cities-shows").childNodes.forEach((city) => {
        if (filter && !city.getAttribute("data-city").toLowerCase().includes(filter.toLowerCase())) {
            city.classList.remove("show");
        } else {
            city.classList.add("show");
        }
    });
}

document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("card-date")) {
        if (!e.target.classList.contains("active")) {
            document.querySelector(".card-date.active").classList.remove("active");
            e.target.classList.add("active");
            printMovie();
        }
    }

    if ((target = hasParentClass(e.target, "card-subcard"))) {
        document.querySelector(".modal-iframe").src = `/lock?id_cine=${target.getAttribute("id_cine")}&id_movie=${target.getAttribute("id_movie")}`;
        document.querySelector(".modal.movie").classList.add("show-modal");
        document.body.classList.add("no-scroll");
        return;
    }

    if ((target = hasParentClass(e.target, "where"))) {
        document.querySelector(".modal.location").classList.add("show-modal");
        document.body.classList.add("no-scroll");
        return;
    }

    if ((target = hasParentClass(e.target, "reload-button"))) {
        document.querySelector(".modal-iframe").contentWindow.location.reload();
        return;
    }

    if ((target = hasParentClass(e.target, "close-button"))) {
        document.querySelectorAll(".modal").forEach((modal) => modal.classList.remove("show-modal"));
        document.body.classList.remove("no-scroll");
        return;
    }

    if ((target = hasParentClass(e.target, "city-cbtn"))) {
        target = target.parentNode.parentNode;
        console.log(target);
        if (!target.querySelector(".city-cinema").classList.contains("show")) {
            document.querySelectorAll(".city-cinema.show").forEach((city) => city.classList.remove("show"));
            document.querySelectorAll(".city-cbtn i.down").forEach((icon) => icon.classList.remove("down"));
        }

        target.querySelector(".city-cinema").classList.toggle("show");
        target.querySelector("i").classList.toggle("down");
        return;
    }

    if ((target = hasParentClass(e.target, "link-city"))) {
        target = target.parentNode;
        var queryParams = new URLSearchParams(window.location.search);
        queryParams.set("cine", target.getAttribute("data-cinema"));
        history.replaceState(null, null, "?" + queryParams.toString());
        window.location.reload();
        return;
    }
});

document.querySelector(".search-bar").addEventListener("keyup", printMovie);
document.querySelector(".search-input").addEventListener("keyup", printCities);

(async () => {
    // loading bar animation
    const progressText = document.getElementById("progress-bar__text");
    const statusBar = document.getElementById("progress-bar__status-bar");

    const urlParams = new URLSearchParams(window.location.search);
    const cine = urlParams.get("cine");
    if (!cine) {
        setQueryStringParameter("cine", "cinema-gaumont-montpellier-multiplexe");
        window.location.reload();
    }
    citiesShows(cine);

    let movies = await fetch(`/movies/${cine}`).then((res) => res.json());
    let all_movies = await fetch(`/data_movies`).then((res) => res.json());

    let movies_list = [];
    let movies_day = [];

    await Promise.all(
        Object.keys(movies).map(
            (key) =>
                new Promise(async (resolve, reject) => {
                    let movie = all_movies.find((movie) => movie.slug == key);
                    let info = {
                        showtime: await fetch(`/movies/showtimes/${cine}/${key}`).then((res) => res.json()),
                        img: movie.posterPath.md,
                        title: movie.title,
                        subtitle: `${movie.genres.join(" / ")} ${minutesToHms(movie.duration)}`,
                        body: movies[key].body,
                        dates: [],
                    };
                    for (date in info.showtime) {
                        for (let data of info.showtime[date]) {
                            let [id_cine, id_movie] = data.refCmd.split("/").at(-2).replace("V", "").split("S");
                            let dinfo = { id_cine, id_movie, hour: data.time.split(" ")[1].split(":").slice(0, 2).join("h"), date: new Date(data.time.split(" ")[0]).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) };
                            if (new Date(data.time) > new Date()) {
                                info.dates.push(dinfo);
                                movies_day.push(removeTime(new Date(data.time.split(" ")[0])));
                            }
                        }
                    }
                    movies_list.push(info);

                    // loading bar animation
                    let progressStatus = Math.round((movies_list.length / Object.keys(movies).length) * 100);
                    progressText.textContent = progressStatus + "%";
                    statusBar.setAttribute("style", `--status: ${progressStatus}`);
                    statusBar.style.width = progressStatus + "%";
                    resolve();
                })
        )
    );

    document.querySelector(".progress").remove();

    movies_day = movies_day
        .map((date) => date.getTime())
        .filter((date, i, array) => array.indexOf(date) === i)
        .map((time) => new Date(time))
        .sort((a, b) => a - b);
    let movies_day_div = document.querySelector(".date");
    for (let day of movies_day) {
        let tmp = document.createElement("div");
        tmp.classList.add("card-date");
        if (day === movies_day[0]) tmp.classList.add("active");
        tmp.innerHTML = day.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
        movies_day_div.appendChild(tmp);
    }
    window.global_movies = movies_list;
    printMovie();
})();
