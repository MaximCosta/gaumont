let template_card = `<div class="card-img"><img src="{{img}}" alt="" srcset=""></div><div class="card-body"><div class="card-info"><div class="card-title">{{title}}</div><div class="card-subtitle">{{subtitle}}</div></div><div class="card-movie nyan"></div></div>`;
let template_subcard = `<div class="subcard-body"><div class="card-title">{{hour}}</div><div class="card-subtitle">{{date}}</div></div>`;
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

async function iframeLoaded() {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    if ((iFrameID = document.getElementById("idIframe"))) {
        iFrameID.height = iFrameID.contentWindow.document.body.scrollHeight + "px";
        iFrameID.width = iFrameID.contentWindow.document.body.scrollWidth + "px";
    }
}

(async () => {
    document.body.addEventListener("click", (e) => {
        if ((target = hasParentClass(e.target, "card-subcard"))) {
            document.querySelector(".modal-iframe").src = `/lock?id_cine=${target.getAttribute("id_cine")}&id_movie=${target.getAttribute("id_movie")}`;
            document.querySelector(".modal").classList.add("show-modal");
            return;
        }
        if ((target = hasParentClass(e.target, "close-button"))) {
            document.querySelector(".modal").classList.remove("show-modal");
            return;
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const cine = urlParams.get("cine");
    if (!cine) {
        setQueryStringParameter("cine", "cinema-gaumont-montpellier-multiplexe");
        window.location.reload();
    }

    let movies = await (await fetch(`http://127.0.0.1:5000/movies/${cine}`)).json();
    let all_movies = await (await fetch(`http://127.0.0.1:5000/data_movies`)).json();

    let movies_div = document.querySelector(".card-container");
    for (let key in movies) {
        let card = document.createElement("div");
        let tmp = template_card;
        let tmp_movie = all_movies.find((movie) => movie.slug == key);
        let tmp_showtime = await (await fetch(`http://127.0.0.1:5000/movies/showtimes/${cine}/${key}`)).json();

        card.classList.add("card");
        tmp = tmp.replace("{{img}}", tmp_movie.posterPath.md);
        tmp = tmp.replace("{{title}}", tmp_movie.title);
        tmp = tmp.replace("{{subtitle}}", `${tmp_movie.genres.join(" / ")} ${minutesToHms(tmp_movie.duration)}`);
        tmp = tmp.replace("{{body}}", movies[key].body);
        card.innerHTML = tmp;
        for (date in tmp_showtime) {
            for (let data of tmp_showtime[date]) {
                let subcard = document.createElement("div");
                let tmp_subcard = template_subcard;
                let [id_cine, id_movie] = data.refCmd.split("/").at(-2).replace("V", "").split("S");
                subcard.classList.add("card-subcard");
                subcard.setAttribute("id_cine", id_cine);
                subcard.setAttribute("id_movie", id_movie);
                tmp_subcard = tmp_subcard.replace("{{hour}}", data.time.split(" ")[1].split(":").slice(0, 2).join("h"));
                tmp_subcard = tmp_subcard.replace("{{date}}", new Date(data.time.split(" ")[0]).toLocaleDateString().replaceAll("/", " / "));
                subcard.innerHTML = tmp_subcard;
                card.querySelector(".card-movie").appendChild(subcard);
            }
        }
        movies_div.appendChild(card);
    }
})();
