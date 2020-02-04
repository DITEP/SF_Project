from application import db

class Queue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    userid = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    text = db.Column(db.Text, unique=False, nullable=False)
    nip = db.Column(db.String(20), unique=False, nullable=False)
    datecr = db.Column(db.Date, unique=False, nullable=False)
    

    def __repr__(self):
        return '<Queue %r>' % self.id
        
    def to_dict(self):
      return {'id':self.id, 'userID':self.userid,'text':self.text,'nip':self.nip,'dateCr':self.datecr}