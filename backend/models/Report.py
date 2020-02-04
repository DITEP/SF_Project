from application import db

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    userid = db.Column(db.Integer, db.ForeignKey('user.id'),nullable=False)
    user = db.relationship('User',backref=db.backref('reports', lazy=True))
    
    text = db.Column(db.Text, unique=False, nullable=False)
    nip = db.Column(db.String(20), unique=False, nullable=False)
    result = db.Column(db.Float, unique=False, nullable=True)
    datecr = db.Column(db.Date, unique=False, nullable=False)
    screenfail = db.Column(db.Boolean, unique=False, nullable=True)
    display = db.Column(db.Boolean, unique=False, nullable=False)
    

    def __repr__(self):
        return '<Report %r>' % self.id
    
    def to_dict(self):

      return {'id':self.id, 'user':self.user.to_dict(),'text':self.text,'nip':self.nip,'result':self.result,'datecr':self.datecr,'screenfail':self.screenfail,'display':self.display}