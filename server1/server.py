# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, url_for, session, flash, redirect, jsonify, g
import os
import pymysql.cursors
import pymysql
import time
from passlib.hash import pbkdf2_sha256 as hasher
from scripts.pred import pred
from datetime import timedelta

app = Flask(__name__)

app.isCalculating = False


################
#db connection
################

def connect_db():
    return pymysql.connect(
        user = 'root', password = 'root', database = 'ssdreports', 
        autocommit = True, 
        cursorclass = pymysql.cursors.DictCursor)

def get_db():
    '''Opens a new database connection per request.'''        
    if not hasattr(g, 'db'):
        g.db = connect_db()
    return g.db    

@app.teardown_appcontext
def close_db(error):
    '''Closes the database connection at the end of request.'''    
    if hasattr(g, 'db'):
        g.db.close()    



##########
#routes
##########

#index route
@app.route('/',methods=['GET','POST'])
def index():
  if not session.get('logged_in'):
      return redirect(url_for('client_login'))
  else:
      return render_template("index.html")
  return render_template("index.html")


###route to log in and get to the index
@app.route('/login',methods = ['GET', 'POST'])
def client_login():
    if session.get('logged_in'):
        return redirect(url_for('index'))

    if request.method == "POST":
        cursor = get_db().cursor()
        sql = "SELECT * FROM `practitioners` WHERE `Username`=%s"
        try:
            cursor.execute(sql, (request.form['username']))
        except mariadb.Error as error:
            print("Error: {}".format(error))
        result = cursor.fetchone()

        #Check if username is correct
        if result == None:
            flash('Unknown username !')
        else:
            #Check if user is already connected
            #if result['isconnected']:
              #flash("You are already connected !")
              #return render_template("login.html")
            
            #Check if password is also correct and connect accordingly
            if hasher.verify(request.form['password'],result['password']):
                session.permanent = True
                
                session['logged_in'] = True
                #add Name and Surname to session for display
                session['name'] = result['name']
                session['surname'] = result['surname']
                session['id'] = result['idpractitioner']
                return redirect(url_for('index'))
            else:
                flash('Wrong password !')

    return render_template("login.html")

#Logout route
@app.route('/logout',methods=['GET'])
def client_logout():
  if session.get('logged_in'):
    session.clear()
  return redirect(url_for('client_login'))


#Register route
@app.route('/register',methods=['GET'])
def register():
  return render_template('register.html')

@app.route('/register/client', methods=['POST'])
def client_registration():
  username = request.form['username']
  password = hasher.hash(request.form['password'])
  name = request.form['name']
  surname = request.form['surname']
  
  
  
  cursor = get_db().cursor()
  insert_text = "INSERT INTO `practitioners` (`username`,`password`,`name`,`surname`,`function`) Values (%s,%s,%s,%s,%s)"
  cursor.execute(insert_text, (username,password,name,surname,'Dr'))
  
  return redirect(url_for('client_login'))

#### Route to compute the prediction. In addition to the result, other elements used for vizualisation are returned (attentions and sentences)
@app.route('/pred', methods = ['POST'])
def predict():
    if session.get('logged_in'):
        data = request.get_json()
        if data['text'] != "":
            while(app.isCalculating):
              #flash('There is already a calculation in progress, please wait')
              time.sleep(5)
            #flash('Your calculation is starting')
            (result, sentences,sentence_attentions,word_attentions) = calculate(data)
            res = {}
            res['result'] = str(result) + '%'
            #attentions, colors et  sentences sont des listes de liste au cas ou plusieurs textes
            #sont envoyés à la fonction pred. Ici, comme on envoie qu'un seul text, on récupère toujours
            #le premier élement de ces listes.
            res['sentence_attentions'] = sentence_attentions.tolist()[0]
            res['word_attentions'] = word_attentions.tolist()[0]
            res['sentences'] = sentences[0]

            return jsonify(res)
            
        else:
            return jsonify('0%')
    return redirect(url_for('client_login'))

#calculate the attentions and set the global variable isCalculating
def calculate(data):
    app.isCalculating = True
    try:
        (prediction, sentences,sentence_attentions,word_attentions) = pred([data['text']],app.root_path)
        result = round(float(prediction)*100, 3)
        cursor = get_db().cursor()
        insert_text = "INSERT INTO `reports` (`practitioner`,`nip`,`text`,`result`,`datecr`,`dateinclusion`) Values (%s,%s,%s,%s,%s,%s)"
        try:
            cursor.execute(insert_text, (session['id'],data['nip'],data['text'],result,data['dateCr'],data['dateInc']))
        except Exception as error:
            print("Error: {}".format(error))
        app.isCalculating = False
        return (result, sentences,sentence_attentions,word_attentions)
    except Exception as error:
        app.isCalculating = False
        print("Unexpected Error: {}".format(error))
        return(-1)

    

#Route to check past patients and add infos on them
@app.route('/patients', methods = ['GET'])
def patients():
    if session.get('logged_in'):
        cursor = get_db().cursor()
        sql = "SELECT * FROM reports WHERE Practitioner = %s and display = 1"
        try:
            cursor.execute(sql,(session['id']))
            patients = cursor.fetchall()
        except Exception as error:
            print("Error: {}".format(error))
        return render_template('patients.html',patients=patients)
    else:
        return redirect(url_for('client_login'))
        
#update the database with the info added on patients.html
@app.route('/patients/additional_infos', methods = ['POST'])
def add_patient_infos():
  if session.get('logged_in'):
    cursor = get_db().cursor()
    sql = "UPDATE reports SET trueresult = %s WHERE idreport = %s"
    try:
        cursor.execute(sql,(request.form['actualResult'],request.form['id']))
    except Exception as error:
        print("Error: {}".format(error))
    
  return redirect(url_for('patients'))
  
#remove selected patient from the displayed ones.
@app.route('/patients/remove_patient', methods = ['POST'])
def remove_patient():
  if session.get('logged_in'):
    cursor = get_db().cursor()
    sql = 'UPDATE reports SET display = 0 WHERE idreport = %s'
    try:
        cursor.execute(sql,(request.form['id']))
    except Exception as error:
        print("Error: {}".format(error))
  return redirect(url_for('patients'))

#Shows removed patients and can ask to put them back into patient list
@app.route('/history',methods = ['GET'])
def deleted():
    if session.get('logged_in'):
        cursor = get_db().cursor()
        sql = "SELECT * FROM reports WHERE practitioner = %s AND display = 0"
        try:
            cursor.execute(sql,(session['id']))
            patients = cursor.fetchall()
        except Exception as error:
            print("Error: {}".format(error))
        return render_template('deleted.html',patients=patients)
    else:
        return redirect(url_for('client_login'))


@app.route('/history/back_to_patients',methods=['POST'])
def undelete():
  if session.get('logged_in'):
    cursor = get_db().cursor()
    sql = 'UPDATE reports SET display = 1 WHERE idreport = %s'
    try:
        cursor.execute(sql,(request.form['id']))
    except Exception as error:
        print("Error: {}".format(error))
  return redirect(url_for('patients'))

  
  
###########
#run app
###########

if __name__ == '__main__':
    app.secret_key = os.urandom(24)
    app.permanent_session_lifetime =  timedelta(minutes=60)
    app.run(host = "0.0.0.0", port = 5000, debug=True)
