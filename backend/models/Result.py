from application import db

class Result(db.Model):
    id = db.Column(db.Integer, primary_key=True,autoincrement=True)

    reportid = db.Column(db.Integer, db.ForeignKey('report.id'),nullable=False)
    report = db.relationship("Report")

    modelid = db.Column(db.Integer, db.ForeignKey('model.id'),nullable=False)
    model = db.relationship("Model")

    userid = db.Column(db.Integer, db.ForeignKey('user.id'),nullable=False)
    user = db.relationship('User')


    valueComputed = db.Column(db.String(20), unique=False, nullable=False)
    result = db.Column(db.Float, unique=False, nullable=False)
    groundTruth = db.Column(db.Integer,unique=False,nullable=True)

    display = db.Column(db.Boolean, unique=False, nullable=False)
    

    def __repr__(self):
        return '<Result %r>' % self.id
    
    def to_dict(self):
      return {'id':self.id, 'report':self.report.to_dict(), 'model':self.model,'user':self.user.to_dict(),'valueComputed':self.valueComputed,'result':self.result,'groudTruth':self.groundTruth,'display':self.display}