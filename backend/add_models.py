import os
from models.Model import Model

def add_models(db):
    #Read files in controllers/data
    files = os.listdir(os.environ['BACKEND_UPLOAD_FOLDER'])
    HAN_FILE_TYPES = ["hd5"]
    RF_FILE_TYPES = ["pkl"]
    han_cnt = 0
    rf_cnt = 0
    for filename in files:
        #Add all han models
        if filename.split(".")[-1] in HAN_FILE_TYPES:
            existingModel = Model.query.filter_by(filename=filename,modelClass="HAN").first()
            if not existingModel:
                db.session.add(Model(name=f'HAN_{han_cnt}',modelClass="HAN",filename=filename,toUse=False,output="screenfail"))
                han_cnt += 1

        #Add all rf models
        if filename.split(".")[-1] in RF_FILE_TYPES:
            existingModel = Model.query.filter_by(filename=filename,modelClass="RF").first()
            if not existingModel:
                db.session.add(Model(name=f'RF_{rf_cnt}',modelClass="RF",filename=filename,toUse=False,output="screenfail"))
                rf_cnt += 1
    
    #Make HAN model usable
    #Check if there was an existing model in use in db
    han_model_in_use = Model.query.filter_by(toUse=True,modelClass=["HAN"]).first()
    if not han_model_in_use:
        if han_cnt > 0:
            Model.query.filter_by(name=f'HAN_{han_cnt}',modelClass="HAN").update(dict(toUse=True))
    
    #Make rf model usable
    #Check if there was an existing model in use in db
    rf_model_in_use = Model.query.filter_by(toUse=True,modelClass=["RF"]).first()
    if not rf_model_in_use:
        if rf_cnt > 0:
            Model.query.filter_by(name=f'RF_{rf_cnt}',modelClass="RF").update(dict(toUse=True))
    
    db.session.commit()