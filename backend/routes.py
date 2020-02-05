from flask import Blueprint, request, jsonify

from passlib.hash import sha256_crypt as hasher

from flask_jwt_extended import (create_access_token, jwt_required, jwt_refresh_token_required, get_jwt_identity, get_raw_jwt)
from application import jwt

from flask_mail import Message
from application import mail

from application import db
from models.User import User
from models.Report import Report
from models.Queue import Queue

from controllers.pred import pred

import time

routes = Blueprint('routes', __name__)
db.create_all()
###
# Defines all routes used in the backend, checks for authentication (jwt_required), passes data to appropriate controller
###

### Authentication

# Check user, create token, redirect
@routes.route('/login',methods=['POST'])
def login():
  data = request.get_json()
  user = User.query.filter_by(username=data['username']).first()
  
  if user and hasher.verify(data['password'], user.password):
    user = user.to_dict()
    access_token = create_access_token(identity=user)
    user['token'] = access_token
    return jsonify({'ok': True, 'data': user}), 200
  else:
    return jsonify({'ok': False, 'message': 'invalid username or password'}), 401
  
##To add : check validity of inserted data
  #else:
  #  return jsonify({'ok': False, 'message': 'Bad request parameters: {}'.format(data['message'])}), 400
    
    
@routes.route('/logoutAccessToken',methods=['DELETE'])
def logout():
    jti = get_raw_jwt()['jti']
    token = {}
    token['expiredToken'] = jti
    token['createdAt'] = datetime.utcnow()
    try:
        return jsonify({"msg": "Successfully logged out"}), 200
    except:
        return jsonify({'ok': False, 'message': 'Something went wrong'}), 500
  
@routes.route('/hasAuth',methods=['GET'])
@jwt_required
def checkAuth():
  try:
    token = request.headers.get('Authorization')
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200
  except:
    return jsonify({'ok': False, 'message': 'invalid username or password'}), 401


### User

# Get, create, update a single user
@routes.route('/user',methods=['GET','POST'])
def user():
  if request.method == 'POST':
    userData = request.get_json()
    #email check
    userId = db.session.query(User.id).filter(User.email==userData['email'])
    emailExists = db.session.query(userId.exists()).scalar()
    
    #username check
    userId = db.session.query(User.id).filter(User.username==userData['username'])
    usernameExists = db.session.query(userId.exists()).scalar()
    if emailExists:
      return jsonify({'ok': False, 'message': 'Email already exists!', 'origin' : 'email'}), 409
    elif usernameExists:
      return jsonify({'ok': False, 'message': 'Username already exists!', 'origin' : 'username'}), 409
    else:
      newUser = User(username=userData['username'],password=hasher.hash(userData['password']),email=userData['email'])
      db.session.add(newUser)
      db.session.commit()
      return jsonify({'ok': True, 'message': 'User created successfully!'}), 200
      
      
  else:
    users = User.query.all()
    for i in range(len(users)):
      users[i] = users[i].to_dict()
    return jsonify(users), 200
    
    
### Prediction

@routes.route('/submitPrediction',methods=['POST'])
def submitPred():
  try:
    data = request.get_json()
    #check if report is already in database
    checkReport = Report.query.filter_by(nip=data['nip'],datecr=data['dateCr']).first()
    if checkReport : return jsonify({'ok': False, 'message': 'Report already in database!'}), 409
    #Add prediction to the queue
    newPred = Queue(userid=data['userID'],text=data['text'],nip=data['nip'],datecr=data['dateCr'])
    db.session.add(newPred)
    db.session.commit()

    return jsonify({'ok': True, 'message': 'Prediciton submitted successfully!'}), 200
  except Exception as error:
    print(error)
    return jsonify({'ok': False, 'message': 'Error during prediction submit!'}), 400

@routes.route('/predict', methods=['POST'])
def predict():
  try:
    data = request.get_json()
    #Get result previously posted to db
    report = Queue.query.filter_by(userid=data['userID']).first().to_dict()
    res = {}
    (res['result'], res['sentences'], res['sentence_attentions'],res['word_attentions']) = compute(report['text'])
    
    #Add report to db
    reportEntry = Report(userid=data['userID'],text=report['text'],nip=report['nip'],result=res['result'],datecr=report['dateCr'],display=True)
    db.session.add(reportEntry)
    #Remove prediction from queue  
    Queue.query.filter_by(userid=data['userID']).delete()
    db.session.commit()
    
    return jsonify(res)
  except Exception as error:
    #Delete from queue when an error occur
    Queue.query.filter_by(userid=data['userID']).delete()
    db.session.commit()
    print(error)
    return jsonify({"ok":False,"message": "Error during Prediction", "error":"Unexpected Error: {}".format(error)}), 400
    
#compute the attentions and result based on a text
def compute(text):
    try:
        (result, sentences,sentence_attentions,word_attentions) = pred(text)
        #data is given back as part of a list of one element that we need to extract
        #We're also converting data into list for use in JSON
        result = float(result)
        sentence_attentions = sentence_attentions.tolist()
        word_attentions = word_attentions.tolist()
        return (result, sentences,sentence_attentions,word_attentions)
    except Exception as error:
        print("Unexpected Error: {}".format(error))
        return "Unexpected Error: {}".format(error)
        
        
### Queue

#CheckUserInQueue checks if user is in queue and returns his position. If the user is not in queue, position is set to -1.
@routes.route('/checkUserInQueue', methods=['POST'])
def checkQueue():
  try:
    userData = request.get_json()
    inQueue = Queue.query.all()
    for i in range(len(inQueue)):
      inQueue[i] = inQueue[i].to_dict()
      if (inQueue[i]['userID'] == userData['userID']):
        return jsonify({"ok":True,"message":'User is in queue', "position":i}), 200
    return jsonify({"ok":True,"message":'User is not in queue', "position":-1}), 200
  except Exception as error:
    print(error)
    return jsonify({"ok":False,"message": "Error checking Queue", "error":str(error)}), 400

@routes.route('/removeJobFromQueue', methods=['DELETE'])
def removeJob():
  try:
    userData = request.get_json()
    Queue.query.filter_by(userid=userData['userID']).delete()
    db.session.commit()
    return jsonify({"ok":True,"message":'Job successfully deleted from queue'}), 200
  except Exception as error:
    print(error)
    jsonify({"ok":False,"message": "Error deleting from Queue", "error":str(error)}), 400


### Patients
@routes.route('/patients', methods=['GET'])
def patient_list():
  try:
    patients = Report.query.order_by(Report.datecr.desc()).all()
    for i in range(len(patients)):
      patients[i] = patients[i].to_dict()
    return jsonify(patients), 200
  except Exception as error:
    print("Unexpected Error: {}".format(error))
    return jsonify({"ok":False,"message": "Error loading patients", "error":str(error)}), 400
    
@routes.route('/attention', methods=['POST'])
def attentionValue():
  try:
    res = {}
    (result, res['sentences'], res['sentence_attentions'],res['word_attentions']) = compute(request.get_json()['text'])
    return jsonify(res)
  except Exception as error:
    print("Unexpected Error: {}".format(error))
    return jsonify({"ok":False,"message": "Error during attention compute", "error":str(error)}), 400
    
@routes.route('/updatePatient',methods=["POST"])
def updatePatient():
  try:
    data = request.get_json()
    patient = Report.query.filter_by(id=data['id']).update(dict(screenfail=data['screenfail']))
    db.session.commit()
    return jsonify({'ok': True, 'message': 'Patient Updated successfully!'}), 200
  except Exception as error:
    print("Unexpected Error: {}".format(error))
    return jsonify({'ok': False, 'message': 'Error updating patient!'}), 400