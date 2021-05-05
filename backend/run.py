import os
from application import create_app
app = create_app()
app.run(host="localhost", port=os.environ['BACKEND_PORT'], debug=True)
