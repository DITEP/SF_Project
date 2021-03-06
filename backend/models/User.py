from application import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    isAdmin = db.Column(db.Boolean,unique=False,nullable=False)
    

    def __repr__(self):
        return '<User %r>' % self.username
        
    def to_dict(self):
      return {'id':self.id, 'username':self.username,'email':self.email, 'isAdmin':self.isAdmin}