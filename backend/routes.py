from flask import Blueprint, request, jsonify

from passlib.hash import sha256_crypt as hasher
from werkzeug.utils import secure_filename

from flask_jwt_extended import (create_access_token, jwt_required, jwt_refresh_token_required, get_jwt_identity, get_raw_jwt)
from application import jwt

from flask_mail import Message
from application import mail

from application import db
from models.User import User
from models.Report import Report
from models.Queue import Queue
from models.Model import Model
from models.Result import Result

from controllers.han_pred import han_inference
from controllers.rf_pred import rf_inference

import time
import os

routes = Blueprint('routes', __name__)
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
    token['createdAt'] = time.datetime.utcnow()
    try:
        return jsonify({"msg": "Successfully logged out"}), 200
    except:
        return jsonify({'ok': False, 'message': 'Something went wrong'}), 500
  
@routes.route('/hasAuth',methods=['GET'])
@jwt_required
def checkAuth():
  try:
    #token = request.headers.get('Authorization')
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200
  except:
    return jsonify({'ok': False, 'message': 'invalid username or password', "error":str(error)}), 401


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
            newUser = User(username=userData['username'],password=hasher.hash(userData['password']),email=userData['email'],isAdmin=False)
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
        #get required model from db
        model = Model.query.filter_by(modelClass=data["model"],toUse=True).first()
        #check if report is already in database
        existingReport = Report.query.filter_by(nip=data['nip'],datecr=data['dateCr']).first()
        if existingReport : 
            #submit prediction to queue
            return submit_to_queue(data['userID'],existingReport.id,model.id)
        #report not in db, add it first then submit pred to queue
        else:
            newReport = Report(userid=data['userID'],text=data["text"],nip=data["nip"],datecr=data["dateCr"])
            db.session.add(newReport)
            db.session.flush()
            #Add prediction to the queue
            return submit_to_queue(data['userID'],newReport.id,model.id)
    except Exception as error:
        print(error)
        return jsonify({'ok': False, 'message': 'Error during prediction submit!', "error":str(error)}), 400

def submit_to_queue(userID,reportID,modelID):
    newPred = Queue(userid=userID,reportid=reportID,modelid=modelID)
    db.session.add(newPred)
    db.session.commit()
    return jsonify({'ok': True, 'message': 'Prediciton submitted successfully!'}), 200



@routes.route('/predict', methods=['POST'])
def predict():
    try:
        print("PREDICT REQUEST")
        data = request.get_json()
        model = Model.query.filter_by(modelClass=data["model"],toUse=True).first().to_dict()
        userid = data["userID"]

        #Get information from queue
        report = Queue.query.filter_by(userid=userid,modelid=model["id"]).first().to_dict()['report']
        #Remove user from queue  
        Queue.query.filter_by(userid=userid,modelid=model["id"]).delete()
        
        #Make the prediction according to model
        if model["modelClass"] =="HAN":
            print("HAN PREDICTION")
            res,status =  han_predict(report["text"],model["filename"])
        
        if model["modelClass"] =="RF":
            print("RF PREDICTION")
            res,status = rf_predict(report["text"],model["filename"])
        else:
            raise Exception("ModelType does not exist")
        
        #Add result to db if it does not already exist
        existingResult = Result.query.filter_by(modelid=model["id"],reportid=report["id"]).first()
        if not existingResult:
            newResult = Result(modelid=model["id"],reportid=report["id"],userid=userid,valueComputed=model["output"],result=float(res["result"]),display=True)
            db.session.add(newResult)

        #Commit changes
        db.session.commit()
        #send response
        return res,status

    except Exception as error:
        #Delete from queue when an error occur
        Queue.query.filter_by(userid=userid,modelid=model["id"]).delete()
        db.session.commit()
        print(error)
        return jsonify({"ok":False,"message":"Unexpected Error {}. Deleted user position in queue".format(error)}), 400


def han_predict(text,model_file):
    try:
        result, sentences, sentence_attentions, word_attentions = han_inference(text,model_file)

        #data is given back as part of a list of one element that we need to extract
        #We're also converting data into list for use in JSON
        res = {}
        res['result'] = float(result)
        res['sentences'] = sentences
        res['sentence_attentions'] = sentence_attentions.tolist()
        res['word_attentions'] = word_attentions.tolist()
        
        #ADD to result db

        return jsonify(res), 200
    except Exception as error:
        print(error)
        return jsonify({"ok":False,"message": "Error during Prediction", "error":"Unexpected Error: {}".format(error)}), 400
        
def rf_predict(text,model_file):
    try:
        result = rf_inference(text,model_file)
        
        return jsonify({"ok":True,"message":"RF prediction","result":result}), 200
    except Exception as error:
        print(error)
        return jsonify({"ok":False,"message": "Error during Prediction", "error":"Unexpected Error: {}".format(error)}), 400
    

### Queue

#CheckUserInQueue checks if user is in queue and returns his position. If the user is not in queue, position is set to -1.
@routes.route('/checkUserInQueue', methods=['POST'])
def checkQueue():
  try:
    userData = request.get_json()
    model = Model.query.filter_by(modelClass=userData["model"],toUse=True).first()
    inQueue = Queue.query.filter_by(modelid=model.id).all()
    print(inQueue)
    for i,queueElement in enumerate(inQueue):
      if (queueElement.to_dict()['userID'] == userData['userID']):
        return jsonify({"ok":True,"message":'User is in queue', "position":i}), 200
    return jsonify({"ok":True,"message":'User is not in queue', "position":-1}), 200
  except Exception as error:
    print(error)
    return jsonify({"ok":False,"message": "Error checking Queue", "error":str(error)}), 400

@routes.route('/removeJobFromQueue', methods=['DELETE'])
def removeJob():
    try:
        userData = request.get_json()
        model = Model.query.filter_by(modelClass=userData["model"],toUse=True).first()
        Queue.query.filter_by(userid=userData['userID'],modelid=model.id).delete()
        db.session.commit()
        return jsonify({"ok":True,"message":'Job successfully deleted from queue'}), 200
    except Exception as error:
        print(error)
        jsonify({"ok":False,"message": "Error deleting from Queue", "error":str(error)}), 400


### Patients
@routes.route('/crlist', methods=['GET'])
def patients_list():
    try:
        crlist = Report.query.all()
        crlist_sorted = sorted(crlist,key=lambda cr:cr.datecr,reverse=True)
        crlist_dict = [crlist_sorted.to_dict() for crlist_sorted in crlist_sorted]
        return jsonify(crlist_dict), 200
    except Exception as error:
        print("Unexpected Error: {}".format(error))
        return jsonify({"ok":False,"message": "Error loading cr", "error":str(error)}), 400

@routes.route('/updatecr',methods=["POST"])
def updatePatient():
    try:
        data = request.get_json()
        if data['updateScreenfail']:
            Report.query.filter_by(id=data['id']).update(dict(screenfail=data['screenfail']))
        elif data['updateOs']:
            Report.query.filter_by(id=data['id']).update(dict(os=data['os']))
        elif data['updateBoth']:
            Report.query.filter_by(id=data['id']).update(dict(screenfail=data['screenfail'],os=data['os']))
        db.session.commit()
        return jsonify({'ok': True, 'message': 'Patient Updated successfully!'}), 200
    except Exception as error:
        print("Unexpected Error: {}".format(error))
        return jsonify({'ok': False, 'message': 'Error updating patient!', "error":str(error)}), 400


@routes.route('/results', methods=['GET'])
def results_list():
    try:
        results = Result.query.all()
        results_sorted = sorted(results,key=lambda result:result.report.datecr,reverse=True)
        results_dict = [result_sorted.to_dict() for result_sorted in results_sorted]
        return jsonify(results_dict), 200
    except Exception as error:
        print("Unexpected Error: {}".format(error))
        return jsonify({"ok":False,"message": "Error loading results", "error":str(error)}), 400


### MODELS

@routes.route('/uploadmodel', methods = ['POST'])
def upload_file():
    try:
        f = request.files['file']
        data = request.form
        filename = secure_filename(f.filename)
        ACCEPTED_FILE_TYPES = ["hd5","pkl"]
        if (filename.split(".")[-1] not in ACCEPTED_FILE_TYPES):
            raise Exception(f"File type not accepted, only accepted files are those listed: {ACCEPTED_FILE_TYPES}")
        f.save(os.path.join(os.environ['BACKEND_UPLOAD_FOLDER'],filename))
        print(filename)
        #remove previously used algorithm for this class
        if (len(Model.query.filter_by(toUse=True,modelClass=data["modelClass"]).all()) > 0):
            Model.query.filter_by(toUse=True,modelClass=data["modelClass"]).update(dict(toUse=False))
        #Save to DB
        new_model = Model(name=data["name"],modelClass=data["modelClass"],output=data["output"],filename=filename,toUse=True)
        db.session.add(new_model)
        db.session.commit()
        return jsonify({'ok': True, 'message': 'File uploading successfully!'}), 200
    except Exception as error:
        print(error)
        return jsonify({'ok': False, 'message': 'Error uploading file', "error":str(error)}), 400

@routes.route("/getmodels", methods=['GET'])
def get_models():
    try:
        #Return all models in db
        models = Model.query.all()
        ordered_models = sorted(models,key= lambda model:model.modelClass)
        models_dict = [model.to_dict() for model in ordered_models]
        return jsonify(models_dict), 200
    except Exception as error:
        return jsonify({'ok': False, 'message': 'Error accessing db for models', "error":str(error)}), 400

@routes.route("/selectmodel", methods=['POST'])
def select_model():
    try:
        data = request.get_json()
        #Modify DB
        Model.query.filter_by(toUse=True,modelClass=data["modelClass"]).update(dict(toUse=False))
        Model.query.filter_by(id=data["id"]).update(dict(toUse=True))
        db.session.commit()
        return jsonify({'ok': True, 'message': 'New model selected!'}), 200
    except Exception as error:
        return jsonify({'ok': False, 'message': 'Error selecting model', "error":str(error)}), 400

