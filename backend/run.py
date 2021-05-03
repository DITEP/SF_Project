import os
from application import create_app
app = create_app()
app.run(host="localhost", port=5000, debug=True)
