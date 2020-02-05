# Install process
##Simple Way
Simply git clone this repository and enter following command at the root of the project. (docker and docker-compose need to be intalled and user must be part of the docker group)

	$ docker-compose up -d. 

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
-db/data folder below docker-compose.yml
-.env

Beware that if you later remove the images, you will not be able to rebuild them unless you clone the repository again.
You will still be able to remove the containers and run them again from the images.

# Managing running server
## Database
A database backup is set up in the container with image sf_project_periodic-backup. It saves db data on a daily bases and places the mysqldump file inside the folder db/data. This is the best way to access the data located inside the database container.

Otherwise, one can connect to the database container through the adress/port specified when setting it up (initially 0.0.0.0:$SQL_PORT). This can be done with the following command : (use any other user if you created some)

	$ mysql -u $SQL_USERNAME -p -P $SQL_PORT -h 0.0.0.0

## Logs
Full logs can be accessed by setting current directory to the root of the server and entering command (user must have docker rights):

	$ docker-compose log