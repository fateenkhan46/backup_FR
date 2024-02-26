from flask import Flask, render_template, request, jsonify
from crate import client
from flask import request

app = Flask(__name__)

# Connect to CrateDB
connection = client.connect("localhost:4200")

# HTML routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/signup')
def signup():
    return render_template('signup.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/login_face')
def login_face():
    return render_template('login_face.html')

# Sign up route
@app.route('/signup', methods=['POST'])
def signup_post():
    usn = request.form['usn']
    pwd = request.form['pwd']
    name = request.form['name']
    role = request.form['role']
    face_features = request.form.get('face_features', '')

    # Insert user data into CrateDB
    cursor = connection.cursor()
    cursor.execute("INSERT INTO users (usn, pwd, name, role, face_features) VALUES (?, ?, ?, ?, ?)", (usn, pwd, name, role, face_features))
    cursor.close()

    return jsonify({'message': 'User signed up successfully'})

# Login route
@app.route('/login', methods=['POST'])
def login_post():
    usn = request.form['usn']
    pwd = request.form['pwd']

    # Retrieve user from CrateDB
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM users WHERE usn = ? AND pwd = ?", (usn, pwd))
    user = cursor.fetchone()
    cursor.close()

    if user:
        return jsonify({'message': 'Login successful'})
    else:
        return jsonify({'error': 'Invalid credentials'})

@app.route('/login_face', methods=['POST'])
def login_face_post():
    # Receive face descriptor from client-side
    face_descriptor = request.json['faceDescriptor']
    # Perform face recognition using face descriptor
    # Compare with stored face descriptors in the database
    # Return appropriate response based on recognition result
    # For example:
    if face_recognition_successful:
        return jsonify({'message': 'Face recognition successful'})
    else:
        return jsonify({'error': 'Face recognition failed'})
    


if __name__ == '__main__':
    app.run(debug=True)