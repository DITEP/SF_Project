FROM python:3.6

#Set working directory
WORKDIR /app

#Copy everything but what is in the dockerignore file
COPY . .

#Run this on docker start. Pip install is run here so the image is less heavy (but longer to start)
CMD pip install -r requirements.txt \
#Install the corresponding nltk data
&& python -m nltk.downloader punkt \
#Run the app
&& python run.py
