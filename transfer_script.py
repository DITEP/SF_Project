import pandas as pd
import pymysql
from controllers.pred import pred

old_db = pymysql.connect(
        user = 'root', password = 'root', database = 'ssdreports', 
        autocommit = True, 
        cursorclass = pymysql.cursors.DictCursor)
cursor_old = old_db.cursor()

cursor_old.execute('SELECT nip,text,trueresult,datecr from reports')
res = cursor_old.fetchall()

new_db = pymysql.connect(
        user = 'root', password = 'root', database = 'sfproject', 
        autocommit = True, 
        cursorclass = pymysql.cursors.DictCursor)
        
new_cursor = new_db.cursor()

for i in range(len(res)):
  res[i]['result'],sentences,sentence_attentions,word_attentions=pred(res[i]['text'])
  new_cursor.execute('INSERT INTO report (userid,text,nip,result,datecr,screenfail) VALUES (%s,%s,%s,%s,%s,%s)',(1,res[i]['text'],res[i]['nip'],res[i]['result'].tolist()[0][0],res[i]['datecr'],res[i]['trueresult']!='SSD'))
  print(i," is done")

new_db.close()
old_db.close()