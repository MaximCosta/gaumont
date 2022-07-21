import json
from flask import Flask, jsonify
from flask_cors import CORS

from cine import Cine, ShowMovie

app = Flask(__name__)
CORS(app)

showMovie: ShowMovie = ShowMovie()
cine: Cine = Cine()


@app.route("/<int:id_cine>/<int:id_movie>")
def seat_maps(id_cine: int, id_movie: int) -> any:
    cine.change_movie(id_cine, id_movie, cine.get_seats)
    return jsonify(cine.maps)


@app.route("/movies/<cinema>")
def movies(cinema: str):
    showMovie.cinema = cinema
    return jsonify(showMovie.get_movie_list())


@app.route("/movies/<cinema>/<movie>")
def movie(cinema: str, movie: str):
    return jsonify(showMovie.get_movie_list())


if __name__ == "__main__":
    app.debug = True
    app.run()
