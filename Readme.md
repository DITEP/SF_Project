# Install process
## Requirements
### System requirements
-Docker and docker-compose are required, and the install must be done by a user from the docker group.
### Images requirement
following docker images are required:
-sf_project_backend
-sf_project_frontend
-sf_project_periodic-backup
-mysql:5.7 (this one will be automatically downloaded in case it is not in the system's docker image)

those images can be built if the original files were given with the images.
For this, simply add a build command in the docker-compose.yml and specify the right folder ("./backend" for the backend container, "./frontend" for the frontend one and "./db/backup" for the backup one).
Be sure to have the Dockerfile inside those folder and the image should automatically build with the command docker-compose up.

### Files requirement
-docker-compose.yml file at the root of the project
-.env file at same level
-a db folder containing two other folders : data and init. data should be empty while init should contain an init file with the creation of $DATABASE_NAME database.
-any other volumes detailed in the docker-compose file.

## Install
Change directory to the root of the project where docker-compose is located. Enter the command :

	$ docker-compose up -d. 

Server is now installed and runs on adress and port specified in the .env.

# Managing running server
## Database
A database backup is set up in the container with image sf_project_periodic-backup. It saves db data on a daily bases and places the mysqldump file inside the folder db/data. This is the best way to access the data located inside the database container.

Otherwise, one can connect to the database container through the adress/port specified when setting it up (initially 0.0.0.0:$SQL_PORT). This can be done with the following command : (use any other user if you created some)

	$ mysql -u $SQL_USERNAME -p -P $SQL_PORT -h 0.0.0.0

## Logs
Full logs can be accessed by setting current directory to the root of the server and entering command (user must have docker rights):

	$ docker-compose log