import os
from application import create_app
app = create_app()
if ("BACKEND_ADDRESS" in os.environ and "BACKEND_PORT" in os.environ):
    app.run(host=os.environ['BACKEND_ADDRESS'], port=os.environ['BACKEND_PORT'], debug=False)
else:
    app.run(host="localhost", port=8000, debug=False)