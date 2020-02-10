import pymysql.cursors
import pymysql
from passlib.hash import pbkdf2_sha256 as hasher
import sys

# Connect to the database
connection = pymysql.connect(host='localhost',
                             user='root',
                             password='root',
                             db='ssdreports',
                             charset='utf8mb4',
                             cursorclass=pymysql.cursors.DictCursor)

username = sys.argv[1]
password = hasher.hash(sys.argv[2])
name = sys.argv[3]
surname = sys.argv[4]
function = sys.argv[5]


with connection as cursor:
    insert_text = "INSERT INTO `practitioners` (`username`,`password`,`name`,`surname`,`function`) Values (%s,%s,%s,%s,%s)"
    cursor.execute(insert_text, (username,password,name,surname,function))
