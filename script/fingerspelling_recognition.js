const videoElement = document.getElementsByClassName('input-video')[0];
const canvasElement = document.getElementsByClassName('output-canvas')[0];
const pElement = document.getElementsByClassName('result')[0];
const canvasCtx = canvasElement.getContext('2d');

import { JaSpellingClassification } from "./model/fingerspelling_classification.js";
import { calcExplanatoryVariable, get_bounding_rect, get2byteLength } from "./utils/utils.js";

const model = new JaSpellingClassification()

const WHITE = '#ffffffff'
const BLACK = '#000000ff'
const GREEN = '#00ff00ff'
const BOUNDING_BOX_PADDING = 20

}

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 640,
  height: 480
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
    for (const [landmarks, worldLandmarks, handedness] of zip(results.multiHandLandmarks, results.multiHandWorldLandmarks, results.multiHandedness)){
      // MediaPipeで取得した手の形状をCanvasに描画
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00ff00', lineWidth: 3});                 
      drawLandmarks(canvasCtx, landmarks, {color: '#ff0000', lineWidth: 0.5});

      // 指文字分類タスク
      const explanatoryVariable = calcExplanatoryVariable(landmarks, worldLandmarks, handedness);
      model.updateInputData(explanatoryVariable);
      const result = model.classification();
      
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
      // 手の左上の座標を取得 pos = [x, y];
      const pos = get_bounding_rect_top_left(landmarks, canvasElement.width, canvasElement.height);
      var text = canvasCtx.measureText(result);
      // テキストの背景を描画（図形の描画）
      canvasCtx.fillStyle = '#00000080';
      canvasCtx.fillRect(pos[0] - 5, pos[1] - 50, text.width*6, text.width*6);
      // テキストの描画
      canvasCtx.fillStyle = '#ffffffff';
      canvasCtx.font = '3em serif';
      canvasCtx.fillText(result, pos[0], pos[1]);
    }
  }
  canvasCtx.restore();
}
hands.onResults(onResults);

const zip = (...arrays) => {
  const length = Math.min(...(arrays.map(arr => arr.length)));
  return new Array(length).fill().map((_, i) => arrays.map(arr => arr[i]));
}