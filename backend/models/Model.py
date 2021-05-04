from application import db

class Model(db.Model):
    id = db.Column(db.Integer, primary_key=True,autoincrement=True)
    name = db.Column(db.String(20), unique=True, nullable=False)
    
    modelClass = db.Column(db.String(20), unique=False, nullable=False)

    output = db.Column(db.String(20), unique=False, nullable=True)
    filename = db.Column(db.String(50), unique=False, nullable=False)

    toUse = db.Column(db.Boolean,unique=False,nullable=True)
    

    def __repr__(self):
        return '<Model %r>' % self.name
    
    def to_dict(self):
      return {'id':self.id, 'name':self.name,'output':self.output,'modelClass':self.modelClass,'filename':self.filename,'toUse':self.toUse}