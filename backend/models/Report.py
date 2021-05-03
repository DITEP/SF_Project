from application import db

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True,autoincrement=True)
    userid = db.Column(db.Integer, db.ForeignKey('user.id'),nullable=False)
    user = db.relationship('User')
    
    text = db.Column(db.Text, unique=False, nullable=False)
    nip = db.Column(db.String(20), unique=False, nullable=False)
    datecr = db.Column(db.Date, unique=False, nullable=False)
    

    def __repr__(self):
        return '<Report %r>' % self.id
    
    def to_dict(self):

      return {'id':self.id, 'user':self.user.to_dict(),'text':self.text,'nip':self.nip,'datecr':self.datecr}