<h1 align="center"> Phase 1 Screening Prediction API </h1>

# What is it ?
We have develloped a Hierarchical Attention Model (HAN) to predict the inclusion of patient in phase one clinical trials in oncology. That is, to predict whether the patient will pass screening and DLT (Dose Limiting Toxicity) period. An article is under submission, the code is open-source in this repo.

This user-friendly web interface can help doctors use this model to perform predictions.

# Install process
## Simple Way
Simply git clone this repository and enter following command at the root of the project. (docker and docker-compose need to be intalled and user must be part of the docker group)

	$ docker-compose up -d. 
.env file might need some changes to the ports/adresses used. Specifically, if you want to test it locally, set

	BACKEND_HOST_ADRESS=127.0.0.1
	REACT_APP_BACKEND_ADRESS=localhost.

## Minimum requirements
If you do not wish to clone all the repository, or want the minimum amount of files after installation, here are the minimal requirements on the system
### System requirements
-Docker and docker-compose are required, and the install must be done by a user from the docker group.
### Images requirement
following docker images are required:
-sf_project_backend
-sf_project_frontend
-sf_project_periodic-backup
-mysql:5.7 (this one will be automatically downloaded in case it is not in the system's docker image)

Those images will automatically build if you have same set up as the git repository one. Once the image are built, you can remove the all the files appart from those ones :

-docker-compose.yml

-db/data and db/init folder below docker-compose.yml

-.env

Beware that if you later remove the images, you will not be able to rebuild them unless you clone the repository again.
You will still be able to remove the containers and run them again from the images.

## Install and add preexisting data to database
You can start the server with a specific database other than the void one set in this repository. Changing the architecture of the db might require a lot of changes (in the backend server), hence it is adviced to fit your database to the one from this project. Here are the tables and their contents :

	+---------------------+
	| queue               |
	| report              |
	| user                |
	+---------------------+

	queue
	+--------+-------------+------+-----+---------+----------------+
	| Field  | Type        | Null | Key | Default | Extra          |
	+--------+-------------+------+-----+---------+----------------+
	| id     | int(11)     | NO   | PRI | NULL    | auto_increment |
	| userid | int(11)     | NO   | MUL | NULL    |                |
	| text   | text        | NO   |     | NULL    |                |
	| nip    | varchar(20) | NO   |     | NULL    |                |
	| datecr | date        | NO   |     | NULL    |                |
	+--------+-------------+------+-----+---------+----------------+

	report
	+------------+-------------+------+-----+---------+----------------+
	| Field      | Type        | Null | Key | Default | Extra          |
	+------------+-------------+------+-----+---------+----------------+
	| id         | int(11)     | NO   | PRI | NULL    | auto_increment |
	| userid     | int(11)     | NO   | MUL | NULL    |                |
	| text       | text        | NO   |     | NULL    |                |
	| nip        | varchar(20) | NO   |     | NULL    |                |
	| result     | float       | YES  |     | NULL    |                |
	| datecr     | date        | NO   |     | NULL    |                |
	| screenfail | tinyint(1)  | YES  |     | NULL    |                |
	| display    | tinyint(1)  | NO   |     | NULL    |                |
	+------------+-------------+------+-----+---------+----------------+


	user
	+----------+--------------+------+-----+---------+----------------+
	| Field    | Type         | Null | Key | Default | Extra          |
	+----------+--------------+------+-----+---------+----------------+
	| id       | int(11)      | NO   | PRI | NULL    | auto_increment |
	| username | varchar(80)  | NO   | UNI | NULL    |                |
	| password | varchar(255) | NO   |     | NULL    |                |
	| email    | varchar(120) | NO   | UNI | NULL    |                |
	+----------+--------------+------+-----+---------+----------------+

Once you have a SQL database fit to this layout, simply mysqldump it into some .sql file and put it inside db/init folder before running docker-compose up. All files inside init are run when the db docker starts. Make sure to put a USE sfproject at the start of your .sql file, or to change the $DATABASE_NAME environment variable in .env


# Managing running server
## Database
A database backup is set up in the container with image sf_project_periodic-backup. It saves db data on a daily bases and places the mysqldump file inside the folder db/data. This is the best way to access the data located inside the database container.

Otherwise, one can connect to the database container through the adress/port specified when setting it up (initially 0.0.0.0:$SQL_PORT). This can be done with the following command : (use any other user if you created some)

	$ mysql -u $SQL_USERNAME -p -P $SQL_PORT -h 0.0.0.0

## Logs
Full logs can be accessed by setting current directory to the root of the server and entering command (user must have docker rights):

	$ docker-compose log

# Encountered issue

## Flask debug mode
There seem to be an issue between tensorflow>=1.15.0 and flask debug mode. So you should not turn flask debug mode to true(in run.py), or you can and then downgrade tensorflow (1.14.0 worked before). See https://github.com/tensorflow/tensorflow/issues/34607 for more infos.

# Contribution

Contributions and user feebdacks are very welcomed.

Contact: loic.verlingue@gustaveroussy.fr, ugo.benassayag@gmail.com
