# -*- coding: utf-8 -*-

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import time

#flask SQLAlchemy
db = SQLAlchemy()

# flask JSON web token manager
jwt = JWTManager()

#flask mail manager
mail = Mail()




def create_app():
    app = Flask(__name__)
    #config
    app.secret_key = os.urandom(24)
    app.isCalculating = False
    #port and adress for db connection is servicename:3306 because backend connects through the docker-compose network.
    #This can be changed in the docker-compose.yml file by removing the link, but it is not advised.
    app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{os.environ['SQL_USERNAME']}:{os.environ['MYSQL_ROOT_PASSWORD']}@{os.environ['SQL_SERVICENAME']}:3306/{os.environ['DATABASE_NAME']}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    #token expiration is currently set to half a day
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(os.environ['TOKEN_EXPIRATION'])
    app.config['SECRET_KEY'] = os.environ['JWT']

    #set upload directory
    app.config['UPLOAD_FOLDER'] = os.environ['BACKEND_UPLOAD_FOLDER']
    
    #db init
    db.init_app(app)
    
    
    
    
    # JSON web token init
    jwt.init_app(app)
    jwt._set_error_handler_callbacks(app)
    
    # Mail client init
    mail.init_app(app)

    # Cross origin init
    CORS(app, support_credentials=True)

    
    with app.app_context():
        # import blueprints
        from routes import routes
        
        CORS(routes)

        # register blueprints
        app.register_blueprint(routes)
        
        
        # Create tables for our models
        db.create_all()
        print("create db")

        return app
