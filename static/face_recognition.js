document.getElementById('scanFaceBtn').addEventListener('click', function () {
    // Check if the browser supports getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Request access to the user's webcam
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                // Create a video element to display the webcam stream
                var video = document.createElement('video');
                document.body.appendChild(video);

                // Set the video stream as the source
                video.srcObject = stream;

                // Play the video
                video.play();
            })
            .catch(function (err) {
                // Handle errors
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    console.error('User denied permission to access the webcam.');
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    console.error('No webcam found.');
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    console.error('Webcam is already in use or cannot be accessed.');
                } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
                    console.error('Constraints could not be satisfied by available devices.');
                } else if (err.name === 'AbortError') {
                    console.error('getUserMedia request was aborted.');
                } else {
                    console.error('Error accessing webcam: ', err);
                }
            });
    } else {
        console.error('getUserMedia is not supported by this browser.');
    }
});


function startVideo(video) {
    let canvas; // Declare canvas variable outside so it can be accessed globally
    document.body.append(video); // Append the video element to the body

    let faceData = []; // Array to store user data

    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
    ]).then(() => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                video.srcObject = stream;
                video.onloadedmetadata = () => { // Wait for metadata to be loaded
                    canvas = faceapi.createCanvasFromMedia(video); // Create canvas after video has loaded
                    document.body.append(canvas); // Append canvas to the body
                };
            })
            .catch(err => console.error(err));
    });

    video.addEventListener('play', () => {
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        const nameMap = {}; // Map to track if name is associated with descriptor

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            if (resizedDetections.length > 0) { // Check if detections are not empty
                resizedDetections.forEach(({ detection, descriptor }) => {
                    // Check if the face already exists in the faceData array
                    let userExists = false;
                    let existingUserIndex = -1;

                    for (let i = 0; i < faceData.length; i++) {
                        if (faceapi.euclideanDistance(descriptor, faceData[i].descriptor) < 0.6) { // Adjust distance threshold as needed
                            userExists = true;
                            existingUserIndex = i;
                            break;
                        }
                    }

                    if (userExists) {
                        const name = faceData[existingUserIndex].name; // Get the user's name
                        const { x, y, width, height } = detection.box; // Get the coordinates of the face detection box
                        const textX = x + width / 2; // Calculate the x-coordinate for drawing the text
                        const textY = y - 10; // Calculate the y-coordinate for drawing the text

                        // Draw the user's name on the canvas
                        canvas.getContext('2d').fillStyle = '#ffffff'; // Set text color to white
                        canvas.getContext('2d').font = '16px Arial';
                        canvas.getContext('2d').fillText(name, textX, textY);
                    } else {
                        if (!nameMap[descriptor]) { // Check if name is already associated with descriptor
                            const userName = prompt("Please enter your name:"); // Prompt user to enter their name
                            if (userName !== null && userName !== "") {
                                // Add a new user entry to the faceData array
                                faceData.push({
                                    name: userName,
                                    descriptor: descriptor,
                                });
                                nameMap[descriptor] = true; // Mark name as associated with descriptor
                                console.log(userName + " added to the database!");
                            }
                        }
                    }
                });
            }
        }, 100);
        console.log(faceData);
    }); // <-- Add closing parenthesis here
} 