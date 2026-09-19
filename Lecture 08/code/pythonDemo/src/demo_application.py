import json

from movie_controller import MovieController
from movie_service import MovieService


class DemoApplication:
    @staticmethod
    def main(embedding_model):
        json_mapper = json
        movieService = MovieService(embedding_model, json_mapper)
        movieService.initializeMovies()
        return MovieController(movieService)
