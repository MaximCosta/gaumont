from flask import Flask, jsonify, render_template, Response, request
from flask_cors import CORS

from cine import Cine, ShowMovie, All_movie

import json
import os

app = Flask(__name__)
CORS(app)

showMovie: ShowMovie = ShowMovie()
cine: Cine = Cine()
all_movies: All_movie = All_movie()


def root_dir():  # pragma: no cover
    return os.path.abspath(os.path.dirname(__file__))


def get_file(filename):  # pragma: no cover
    try:
        src = os.path.join(root_dir(), filename)
        return open(src, encoding="utf-8").read()
    except IOError as exc:
        return str(exc)


@app.route("/<int:id_cine>/<int:id_movie>")
def seat_maps(id_cine: int, id_movie: int) -> Response:
    return jsonify(cine.get_seats(id_cine, id_movie))


@app.route("/movies/<cinema>")
def movies(cinema: str = "cinema-gaumont-montpellier-multiplexe") -> Response:
    return jsonify(showMovie.get_movie_list(cinema))


@app.route("/movies/<cinema>/<movie>")
def movie(cinema: str, movie: str) -> Response:
    return jsonify(showMovie.get_movie_list(cinema))


@app.route("/movies/showtimes/<cinema>/<movie>")
def showtimes(cinema: str, movie: str) -> Response:
    return jsonify(showMovie.get_movie_showtimes(cinema, movie))


@app.route("/data_movies")
def data_movies() -> Response:
    return jsonify(all_movies.get())


@app.route("/cities")
def cities() -> Response:
    return jsonify(all_movies.get_cities())


@app.route("/lock/<int:id_cine>/<int:id_movie>", methods=["POST"])
def lock_seat(id_cine: int, id_movie: int) -> Response:
    cine.book_seat(id_cine, id_movie, dict(request.form))
    return jsonify({"status": "ok"})


@app.route("/")
def index() -> Response:
    content = get_file("./static/movie.html")
    return Response(content, mimetype="text/html")


@app.route("/lock")
def lock() -> Response:
    content: str = get_file("./static/lock.html")
    return Response(content, mimetype="text/html")


if __name__ == "__main__":
    app.run(debug=True)
