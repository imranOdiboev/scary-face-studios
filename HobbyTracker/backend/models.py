import sqlalchemy as _sql

import database as _database

class User(_database.Base):
    __tablename__ = "users"
    id = _sql.Column(_sql.Integer, primary_key=True, index=True)
    username = _sql.Column(_sql.String, unique=True)
    email = _sql.Column(_sql.String, unique=True)
    password = _sql.Column(_sql.String)