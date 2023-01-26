const videoElement = document.getElementsByClassName('input-video')[0];
const canvasElement = document.getElementsByClassName('output-canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

import { JaSpellingClassification } from "./model/fingerspelling_classification.js";
import { calcExplanatoryVariable, get_bounding_rect, get2byteLength } from "./utils/utils.js";

const model = new JaSpellingClassification()

const WHITE = '#ffffffff'
const BLACK = '#000000ff'
const GREEN = '#00ff00ff'
const BASE_FONTSIZE = 16
const FONTSIZE_MAGNIFICATION = 3;
const BOUNDING_BOX_PADDING = 20

const isSmartPhone = navigator.userAgent.match(/iPhone|Android.+Mobile/);
const isPortrait = window.matchMedia("(orientation: portrait)").matches;

// キャンパスの縦横比を端末と画面に応じて変更
if(isSmartPhone && !isPortrait){
  canvasElement.width = 640;
  canvasElement.height = 480;
}else if(isSmartPhone && isPortrait){
  canvasElement.width = 480;
  canvasElement.height = 640;
}

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  // カメラの縦横比を端末と画面に応じて変更
  width: !isSmartPhone ? 640 : (isPortrait ? 480 : 640),
  height: !isSmartPhone ? 480 : (isPortrait ? 640 : 480)
});
camera.start();

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
  selfieMode: true,
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiHandLandmarks) {
    for (const [landmarks, worldLandmarks, handedness]
          of zip(results.multiHandLandmarks, results.multiHandWorldLandmarks, results.multiHandedness)){
      // MediaPipeで取得した手の形状をCanvasに描画
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00ff00', lineWidth: 3});                 
      drawLandmarks(canvasCtx, landmarks, {color: '#ff0000', lineWidth: 0.5});

      // 指文字分類タスク
      const explanatoryVariable = calcExplanatoryVariable(landmarks, worldLandmarks, handedness);
      model.updateInputData(explanatoryVariable);
      const result = model.classification();
      const text = "result:" + result; 
      
      // 手の左端、上端、右端、下端の座標を取得
      const pos = get_bounding_rect(landmarks, canvasElement.width, canvasElement.height);
      // 手の周りに枠線を描画
      canvasCtx.strokeStyle = GREEN;
      canvasCtx.strokeRect(
        pos[0] - BOUNDING_BOX_PADDING,
        pos[1] - BOUNDING_BOX_PADDING,
        pos[2] - pos[0] + BOUNDING_BOX_PADDING*2,
        pos[3] - pos[1] + BOUNDING_BOX_PADDING*2
      );

      // 分類結果をCanvasに出力
      // テキストの背景を描画
      canvasCtx.fillStyle = GREEN;
      canvasCtx.fillRect(
        pos[0] - BOUNDING_BOX_PADDING,
        pos[1] - BOUNDING_BOX_PADDING - (BASE_FONTSIZE * FONTSIZE_MAGNIFICATION),
        BASE_FONTSIZE * FONTSIZE_MAGNIFICATION * get2byteLength(text),
        BASE_FONTSIZE * FONTSIZE_MAGNIFICATION
      );
      // テキストの描画
      canvasCtx.fillStyle = BLACK;
      canvasCtx.font = FONTSIZE_MAGNIFICATION + 'em serif';
      canvasCtx.fillText(text, pos[0] , pos[1] - BOUNDING_BOX_PADDING);
    }
  }
  canvasCtx.restore();
}
hands.onResults(onResults);

const zip = (...arrays) => {
  const length = Math.min(...(arrays.map(arr => arr.length)));
  return new Array(length).fill().map((_, i) => arrays.map(arr => arr[i]));
}