const video = document.querySelector('#video');
let predictedAges = [];

function init() {
  liveStream();
}

Promise.all([
faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
faceapi.nets.faceExpressionNet.loadFromUri("/models"),
faceapi.nets.ageGenderNet.loadFromUri("/models")
]).then(init);

video.addEventListener('playing', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    let isShowFaceLandmarks = document.getElementById('isShowFaceLandmarks').checked;
    let isShowFaceExpressions = document.getElementById('isShowFaceExpressions').checked;
    let isShowAge = document.getElementById('isShowAge').checked;
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    if(isShowFaceLandmarks) {
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    }
    if(isShowFaceExpressions) {
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    }
  

  //age prediction
  if(isShowAge) {
    agePrediction(resizedDetections, canvas);
  }
}, 100);
});

function liveStream() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(stream => {
    video.srcObject = stream;
    video.onloadedmetadata = (e) => {
      video.play();
    };
  }).catch(err => {
    alert("Somthing went wrong!");
  });
}

function agePrediction(resizedDetections, canvas) {
  const age = resizedDetections[0].age;
  const interpolatedAge = interpolateAgePredictions(age);
  const bottomRight = {
    x: resizedDetections[0].detection.box.bottomRight.x - 50,
    y: resizedDetections[0].detection.box.bottomRight.y
  };

  new faceapi.draw.DrawTextField(
    [`${faceapi.utils.round(interpolatedAge, 0)} years`],
    bottomRight
  ).draw(canvas);
}

function interpolateAgePredictions(age) {
  predictedAges = [age].concat(predictedAges).slice(0, 30);
  const avgPredictedAge =
    predictedAges.reduce((total, a) => total + a) / predictedAges.length;
  return avgPredictedAge;
}