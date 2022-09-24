from http.client import HTTPSConnection, HTTPResponse
from attrs import define, field

import datetime
import tqdm
import json
import time
import re


@define
class All_movie:
    base: str = field(default="www.cinemaspathegaumont.com", init=False)
    lang: str = field(default="fr", init=False)
    shows: dict = field(default=dict(), init=False)
    cities: list = field(default=list(), init=False)
    last_request: dict = field(default={"shows": 0, "cities": 0}, init=False)
    max_cache_duration: int = field(default=3600, init=False)

    def get(self) -> dict:
        if len(self.shows) and (datetime.datetime.now().timestamp() - self.last_request["shows"]) > self.max_cache_duration:
            return self.shows
        conn: HTTPSConnection = HTTPSConnection(self.base)
        conn.request("GET", f"/api/shows?lang={self.lang}", headers={"Accept": "application/json"})
        response: HTTPResponse = conn.getresponse()
        data: bytes = response.read()
        self.last_request["shows"] = datetime.datetime.now().timestamp()
        self.shows = json.loads(data.decode("utf-8"))["shows"]
        return self.shows

    def get_cities(self) -> list:
        if len(self.cities) and (datetime.datetime.now().timestamp() - self.last_request["cities"]) > self.max_cache_duration:
            return self.cities
        conn: HTTPSConnection = HTTPSConnection(self.base)
        conn.request("GET", f"/api/cities?lang={self.lang}", headers={"Accept": "application/json"})
        response: HTTPResponse = conn.getresponse()
        data: bytes = response.read()
        self.last_request["cities"] = datetime.datetime.now().timestamp()
        self.cities = json.loads(data.decode("utf-8"))
        return self.cities


@define
class ShowMovie:
    base: str = field(default="www.cinemaspathegaumont.com", init=False)
    lang: str = field(default="fr", init=False)
    __cine: str = field(default="cinema-gaumont-montpellier-multiplexe", init=False)

    cache: dict = field(default=dict(), init=False)
    max_cache_duration: int = field(default=3600, init=False)

    def get_movie_list(self, cinema: str = __cine) -> list:
        if (cinema in self.cache) and (datetime.datetime.now().timestamp() - self.cache[cinema]["last_request"]) < self.max_cache_duration:
            return self.cache[cinema]["movies"]
        conn: HTTPSConnection = HTTPSConnection(self.base)
        conn.request("GET", self.url_base(cinema), "", headers={"Accept": "application/json"})
        response: HTTPResponse = conn.getresponse()
        data: bytes = response.read()
        self.cache[cinema] = {"last_request": datetime.datetime.now().timestamp(), "movies": json.loads(data.decode("utf-8"))["shows"]}
        return self.cache[cinema]["movies"]

    def get_movie_showtimes(self, cinema: str = __cine, movie: str = "") -> list:
        if (f"{cinema}_{movie}" in self.cache) and (datetime.datetime.now().timestamp() - self.cache[f"{cinema}_{movie}"]["last_request"]) < self.max_cache_duration:
            return self.cache[f"{cinema}_{movie}"]["showtimes"]
        conn: HTTPSConnection = HTTPSConnection(self.base)
        conn.request("GET", self.url_showtimes(cinema, movie), "", headers={"Accept": "application/json"})
        response: HTTPResponse = conn.getresponse()
        data: bytes = response.read()
        self.cache[f"{cinema}_{movie}"] = {"last_request": datetime.datetime.now().timestamp(), "showtimes": json.loads(data.decode("utf-8"))}
        return json.loads(data.decode("utf-8"))

    def url_base(self, cinema: str = __cine) -> str:
        return f"/api/cinema/{cinema}/shows?language={self.lang}"

    def url_showtimes(self, cinema: str = __cine, movie: str = "") -> str:
        return f"/api/show/{movie}/showtimes/{cinema}?language={self.lang}"


# @define
# class ShowSessions:
#     base: str = field(default="www.cinemaspathegaumont.com", init=False)
#     movie: str = field()
#     cinema: str = field()
#     date: str = field()
#     lang: str = field(default="fr", init=False)

#     def get_session(self) -> dict | list:
#         conn: HTTPSConnection = HTTPSConnection(self.base)
#         conn.request("GET", self.url, "", {"Content-Type": "application/json"})
#         res: HTTPResponse = conn.getresponse()
#         data: bytes = res.read()
#         return json.loads(data.decode("utf-8"))

#     def get_id(self) -> list[list[str]]:
#         return [list(filter(len, re.split("V|S", s["refCmd"].split("/")[-2]))) for s in self.get_session()]

#     def movie_change(self, movie: str, date: str) -> None:
#         self.movie = movie
#         self.date = date

#     @property
#     def url(self) -> str:
#         return f"/api/show/{self.movie}/showtimes/{self.cinema}/{self.date}?language={self.lang}"


@define
class Cine:
    base: str = field(default="s.cinemaspathegaumont.com", init=False)
    token_max_use: int = field(default=3)
    token_max_live: float = field(default=300)
    __token: str = field(init=False, default=None)
    __token_use: int = field(init=False, default=0)
    __token_time: float = field(init=False, default=datetime.datetime.now().timestamp())

    def book_seat(self, id_cine: int, id_movie: int, seat: dict) -> None:
        conn: HTTPSConnection = HTTPSConnection(self.base)
        headers: dict = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        payload: dict = {"seats": [seat], "activeShowing": id_movie}
        conn.request("POST", self.url_book(id_cine, id_movie), json.dumps(payload), headers)
        print("Token: ", conn.getresponse().headers["location"].split("/")[-1])

    def get_seats(self, id_cine: int, id_movie: int) -> list:
        conn: HTTPSConnection = HTTPSConnection(self.base)
        conn.request("GET", self.url_seats(id_cine, id_movie), headers={"Authorization": f"Bearer {self.token}"})
        response: HTTPResponse = conn.getresponse()
        data: dict = json.loads(response.read().decode("utf-8"))
        return data["maps"][0]

    def get_token(self) -> str:
        conn: HTTPSConnection = HTTPSConnection(self.base)
        payload: dict = {"grant_type": "client_credentials", "client_id": "API_CLI"}
        conn.request("POST", self.url_token, json.dumps(payload), {"Content-Type": "application/json"})
        response: HTTPResponse = conn.getresponse()
        data: dict = json.loads(response.read().decode("utf-8"))
        return data["access_token"]

    def url_book(self, id_cine: int, id_movie: int) -> str:
        return f"/api/order/fr-FR/{id_cine}/{id_movie}/seat/allocation?pos=seating"

    def url_seats(self, id_cine: int, id_movie: int) -> str:
        return f"/api/seatmap/fr-FR/{id_cine}/{id_movie}/map"

    @property
    def token(self) -> str:
        if not self.__token or self.__token_use > self.token_max_use or self.__token_time + self.token_max_live < datetime.datetime.now().timestamp():
            self.__token = self.get_token()
            self.__token_use = 0
            self.__token_time = datetime.datetime.now().timestamp()
        self.__token_use += 1
        return self.__token

    @property
    def url_token(self) -> str:
        return "/oauth/api/jwt/token"
