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
        # Figure out how flask returns static files
        # Tried:
        # - render_template
        # - send_file
        # This should not be so non-obvious
        return open(src, encoding="utf-8").read()
    except IOError as exc:
        return str(exc)


@app.route("/<int:id_cine>/<int:id_movie>")
def seat_maps(id_cine: int, id_movie: int) -> any:
    cine.change_movie(id_cine, id_movie, cine.get_seats)
    return jsonify(cine.maps)


@app.route("/movies/<cinema>")
def movies(cinema: str = "cinema-gaumont-montpellier-multiplexe") -> any:
    showMovie.movie_change(cinema=cinema)
    return jsonify(showMovie.get_movie_list())


@app.route("/movies/<cinema>/<movie>")
def movie(cinema: str, movie: str):
    showMovie.movie_change(movie, cinema)
    return jsonify(showMovie.get_movie_list())


@app.route("/movies/showtimes/<cinema>/<movie>")
def showtimes(cinema: str, movie: str):
    showMovie.movie_change(movie, cinema)
    return jsonify(showMovie.get_movie_showtimes())


@app.route("/data_movies")
def data_movies():
    return jsonify(all_movies.get())


@app.route("/cities")
def cities():
    return jsonify(all_movies.get_cities())


@app.route("/lock/<int:id_cine>/<int:id_movie>", methods=["POST"])
def lock_seat(id_cine: int, id_movie: int):
    cine.change_movie(id_cine, id_movie)
    cine.book_seat(dict(request.form))
    return jsonify({"status": "ok"})


@app.route("/")
def index():
    content = get_file("./static/movie.html")
    return Response(content, mimetype="text/html")


@app.route("/lock")
def lock():
    content: str = get_file("./static/lock.html")
    return Response(content, mimetype="text/html")


# @app.route("/", defaults={"path": ""})
# @app.route("/<path:path>")
# def get_resource(path):  # pragma: no cover
#     mimetypes: dict = {
#         ".css": "text/css",
#         ".html": "text/html",
#         ".js": "application/javascript",
#         ".svg": "image/svg+xml",
#         ".png": "image/png",
#         ".jpg": "image/jpeg",
#     }
#     complete_path: str = os.path.join(root_dir(), path)
#     ext = os.path.splitext(path)[1]
#     mimetype: str = mimetypes.get(ext, "text/html")
#     content: str = get_file(complete_path)
#     return Response(content, mimetype=mimetype)


if __name__ == "__main__":
    app.run(debug=True)
