from http.client import HTTPSConnection, HTTPResponse
from attrs import define, field

import datetime
import tqdm
import json
import time
import re


@define
class ShowMovie:
    base: str = field(default="www.cinemaspathegaumont.com", init=False)
    cinema: str = field(default="cinema-gaumont-montpellier-multiplexe")
    lang: str = field(default="fr", init=False)

    def get_movie_list(self) -> list:
        conn: HTTPSConnection = HTTPSConnection(self.base)
        conn.request("GET", self.url, "", {"Content-Type": "application/json"})
        response: HTTPResponse = conn.getresponse()
        data: bytes = response.read()
        return json.loads(data.decode("utf-8"))["shows"]

    @property
    def url(self) -> str:
        return f"/api/cinema/{self.cinema}/shows?language={self.lang}"


@define
class ShowSessions:
    base: str = field(default="www.cinemaspathegaumont.com", init=False)
    movie: str = field()
    cinema: str = field()
    date: str = field()
    lang: str = field(default="fr", init=False)

    def get_session(self) -> dict | list:
        conn: HTTPSConnection = HTTPSConnection(self.base)
        conn.request("GET", self.url, "", {"Content-Type": "application/json"})
        res: HTTPResponse = conn.getresponse()
        data: bytes = res.read()
        return json.loads(data.decode("utf-8"))

    def get_id(self) -> list[list[str]]:
        return [list(filter(len, re.split("V|S", s["refCmd"].split("/")[-2]))) for s in self.get_session()]

    def movie_change(self, movie: str, date: str) -> None:
        self.movie = movie
        self.date = date

    @property
    def url(self) -> str:
        return f"/api/show/{self.movie}/showtimes/{self.cinema}/{self.date}?language={self.lang}"


@define
class Cine:
    base: str = field(default="s.cinemaspathegaumont.com", init=False)
    id_cine: str = field(default=None)
    id_movie: str = field(default=None)
    token_max_use: int = field(default=3)
    token_max_live: float = field(default=300)
    __token: str = field(init=False, default=None)
    __token_use: int = field(init=False, default=0)
    __token_time: float = field(init=False, default=datetime.datetime.now().timestamp())
    __seats: list = field(init=False)
    maps: dict = field(init=False, default=None)

    def change_movie(self, id_cine: str, id_movie: str, callback: callable = lambda x: None) -> None:
        self.id_cine = id_cine
        self.id_movie = id_movie
        callback()

    def lock_seats(self) -> None:
        print("Locking seats...")
        for RowSeat in tqdm.tqdm(self.seats):
            for seat in tqdm.tqdm(RowSeat, leave=False):
                if seat["status"] == 0:
                    self.book_seat(seat)

    def book_seat(self, seat: str) -> None:
        conn: HTTPSConnection = HTTPSConnection(self.base)
        headers: dict = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        payload: dict = {"seats": [seat], "activeShowing": self.i2}
        conn.request("POST", self.url_book, json.dumps(payload), headers)
        time.sleep(0.1)

    def get_seats(self) -> list:
        print("Getting seats...")
        conn: HTTPSConnection = HTTPSConnection(self.base)
        conn.request("GET", self.url_seats, headers={"Authorization": f"Bearer {self.token}"})
        response: HTTPResponse = conn.getresponse()
        data: dict = json.loads(response.read().decode("utf-8"))
        self.maps = data["maps"][0]
        return data["maps"][0]["seats"]

    def get_token(self) -> str:
        print("Getting token...")
        conn: HTTPSConnection = HTTPSConnection(self.base)
        payload: dict = {"grant_type": "client_credentials", "client_id": "API_CLI"}
        conn.request("POST", self.url_token, json.dumps(payload), {"Content-Type": "application/json"})
        response: HTTPResponse = conn.getresponse()
        data: dict = json.loads(response.read().decode("utf-8"))
        return data["access_token"]

    @property
    def token(self) -> str:
        if not self.__token or self.__token_use > self.token_max_use or self.__token_time + self.token_max_live < datetime.datetime.now().timestamp():
            self.__token = self.get_token()
            self.__token_use = 0
            self.__token_time = datetime.datetime.now().timestamp()
        self.__token_use += 1
        return self.__token

    @property
    def seats(self) -> list:
        if not self.__seats:
            self.__seats = self.get_seats()
        return self.__seats

    @property
    def url_token(self) -> str:
        return "/oauth/api/jwt/token"

    @property
    def url_seats(self) -> str:
        return f"/api/seatmap/fr-FR/{self.id_cine}/{self.id_movie}/map"

    @property
    def url_book(self) -> str:
        return f"/api/order/fr-FR/{self.id_cine}/{self.id_movie}/seat/allocation?pos=seating"
