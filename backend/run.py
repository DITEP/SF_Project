import os
from application import create_app
app = create_app()
app.run(host=os.environ['BACKEND_HOST_ADRESS'], port=os.environ['BACKEND_PORT'])