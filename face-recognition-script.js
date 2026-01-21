const video = document.getElementById("video");

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models")
])
  .then(() => {
    console.log("All models loaded");
    return startWebCam();
  })
  .then(() => {
    console.log("Webcam started");
    return faceRecognition();
  })
  .catch((error) => {
    console.error("Error during initialization:", error);
  });

function startWebCam() {
  return navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;
      return new Promise((resolve) => {
        video.addEventListener("loadedmetadata", () => {
          video.width = video.videoWidth;
          video.height = video.videoHeight;
          resolve();
        });
      });
    })
    .catch((error) => {
      console.error("Error accessing webcam:", error);
    });
}

async function getLabeledFaceDescriptions() {
  const labels = ["Ameni"];
  const labeledFaceDescriptors = await Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        try {
          const image = await faceapi.fetchImage(
            `/labels/${label}/${label}${i}.jpg`
          );
          const detections = await faceapi
            .detectSingleFace(image)
            .withFaceLandmarks()
            .withFaceDescriptor();
          
          if (detections) {
            descriptions.push(detections.descriptor);
          } else {
            console.warn(`No face detected in ${label}${i}.jpg`);
          }
        } catch (error) {
          console.error(`Error loading image ${label}${i}.jpg:`, error);
        }
      }
      if (descriptions.length > 0) {
        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      }
      return null;
    })
  );
  
  return labeledFaceDescriptors.filter(desc => desc !== null);
}

async function faceRecognition() {
  try {
    const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    
    if (labeledFaceDescriptors.length === 0) {
      console.error("No face descriptors were loaded. Check your label images.");
      return;
    }
    
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      if (video.paused || video.ended) return;
      
      try {
        const detections = await faceapi
          .detectAllFaces(video)
          .withFaceLandmarks()
          .withFaceDescriptors();
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        const results = resizedDetections.map((detection) => {
          return faceMatcher.findBestMatch(detection.descriptor);
        });
        
        results.forEach((result, i) => {
          const box = resizedDetections[i].detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, {
            label: result.toString()
          });
          drawBox.draw(canvas);
        });
      } catch (error) {
        console.error("Error during face detection:", error);
      }
    }, 100);
  } catch (error) {
    console.error("Error in faceRecognition:", error);
  }
}