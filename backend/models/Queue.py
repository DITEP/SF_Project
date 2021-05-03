from application import db

class Queue(db.Model):
    id = db.Column(db.Integer, primary_key=True,autoincrement=True)

    userid = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    reportid = db.Column(db.Integer, db.ForeignKey('report.id'), nullable=False)
    report = db.relationship("Report")

    modelid = db.Column(db.Integer, db.ForeignKey('model.id'), nullable=False)
    model =  db.relationship("Model")
    def __repr__(self):
        return '<Queue %r>' % self.id
        
    def to_dict(self):
      return {'id':self.id, 'userID':self.userid,'report':self.report.to_dict(),'model':self.model.to_dict()}