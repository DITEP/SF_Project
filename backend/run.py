import os
from application import create_app
app = create_app()
app.run(host="0.0.0.0", port=os.environ['BACKEND_PORT'], debug=False)
