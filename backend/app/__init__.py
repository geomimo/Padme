from flask import Flask
from flask_cors import CORS
from .models import db
from .routes import users, topics, lessons, journey, paths
from config import config

def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    CORS(app)

    with app.app_context():
        db.create_all()

    app.register_blueprint(users.bp)
    app.register_blueprint(topics.bp)
    app.register_blueprint(lessons.bp)
    app.register_blueprint(journey.bp)
    app.register_blueprint(paths.bp)

    return app
