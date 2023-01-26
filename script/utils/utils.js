export const calcExplanatoryVariable = (landmarks, worldLandmarks, handedness) => {
  let explanatoryVariable = calcJointAngles(worldLandmarks);
  explanatoryVariable.push(calcDirectionAngle(worldLandmarks));
  explanatoryVariable.push(isPalmFacing(landmarks, handedness));
  explanatoryVariable.push(calcDistance(worldLandmarks[4], worldLandmarks[8]));
  explanatoryVariable.push(calcDistance(worldLandmarks[4], worldLandmarks[12]));
  explanatoryVariable.push(calcDistance(worldLandmarks[8], worldLandmarks[12]));
  // explanatoryVariable.push((isIntersect(worldLandmarks[7], worldLandmarks[8], worldLandmarks[11], worldLandmarks[12]) | isIntersect(worldLandmarks[6], worldLandmarks[7], worldLandmarks[10], worldLandmarks[11])) ? 1 : 0);
  // console.log(explanatoryVariable);
  return explanatoryVariable;
}

const calc2DAngle = (p1, p2, p3={x: 0, y: 0}) => {
  return Math.atan2((p1["y"] - p3["y"])-(p2["y"] - p3["y"]), (p1["x"] - p3["x"])-(p2["x"] - p3["x"])) * (180.0 / Math.PI) + 180;
}

const calc3DAngle = (p1, p2, p3={x: 0, y: 0, z: 0}) => {
  const number = ((p1["x"] - p3["x"])*(p2["x"] - p3["x"]))+((p1["y"] - p3["y"])*(p2["y"] - p3["y"]))+((p1["z"] - p3["z"])*(p2["z"] - p3["z"]));
  const denom = ((((p1["x"] - p3["x"])**2)+((p1["y"] - p3["y"])**2)+((p1["z"] - p3["z"])**2))**0.5) * ((((p2["x"] - p3["x"])**2)+((p2["y"] - p3["y"])**2)+((p2["z"] - p3["z"])**2))**0.5);
  return Math.acos(number/denom) * (180.0 / Math.PI);
}

const calcJointAngles = (worldLandmarks) => {
  let angles = [];
  for(let idx = 0 ; idx < 21; idx++){
    if(1 <= idx && idx <=20){
      if(idx % 4 != 0 && (idx - 1) % 4 != 0){
        angles.push(calc3DAngle(worldLandmarks[idx-1], worldLandmarks[idx+1], worldLandmarks[idx]));
      }else if((idx - 1) % 4 == 0){
        angles.push(calc3DAngle(worldLandmarks[0], worldLandmarks[idx+1], worldLandmarks[idx]));
      }
    }
  }
  return angles;
}

const calcDirectionAngle = (landmarks) => {
  return calc2DAngle(landmarks[0], landmarks[9]);
}

const isPalmFacing = (landmarks, handedness) => {
  const angle = calc2DAngle(landmarks[0], landmarks[9]);
  const up = (45 <= angle &&  angle <= 125) ? -1 : 1;
  const side = (handedness["label"] == "Right") ? 1 : -1;
  return ((landmarks[5]["x"] * side * up) < (landmarks[17]["x"] * side * up))? 1 : 0;
}

const calcDistance = (p1, p2) => {
  return (((p1["x"]-p2["x"])**2) + ((p1["y"]-p2["y"])**2) + ((p1["z"]-p2["z"])**2))**0.5;
}

const isIntersect = (p1, p2, p3, p4) => {
  const t1 = (p1["x"] - p2["x"]) * (p3["y"] - p1["y"]) + (p1["y"] - p2["y"]) * (p1["x"] - p3["x"]);
  const t2 = (p1["x"] - p2["x"]) * (p4["y"] - p1["y"]) + (p1["y"] - p2["y"]) * (p1["x"] - p4["x"]);
  const t3 = (p3["x"] - p4["x"]) * (p1["y"] - p3["y"]) + (p3["y"] - p4["y"]) * (p3["x"] - p1["x"]);
  const t4 = (p3["x"] - p4["x"]) * (p2["y"] - p3["y"]) + (p3["y"] - p4["y"]) * (p3["x"] - p2["x"]);
  return t1 * t2 <= 0 && t3 * t4 <= 0;
}

export const get_bounding_rect = (landmarks, width, height) => {
  /**
   * return: 左端, 上端, 右端, 下端
   */
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for(const landmark of landmarks){
    if(minX > landmark["x"] * width) minX = landmark["x"] * width;
    if(minY > landmark["y"] * height) minY = landmark["y"] * height;
    if(maxX < landmark["x"] * width) maxX = landmark["x"] * width;
    if(maxY < landmark["y"] * height) maxY = landmark["y"] * height;
  }
  return [parseInt(minX), parseInt(minY), parseInt(maxX), parseInt(maxY)];
}

export const get2byteLength = (text) => {
  /**
   * 半角を0.5、全角を1としたときの文字列の長さを返す
   * return: textLength
   */
  let textLength = 0;
  for(let i = 0; i < text.length; i++){
    let character = text.charCodeAt(i) ;
    if (character >= 0x0 && character <= 0x7f) { 
      textLength += 0.5 ;
    } else { 
      textLength += 1;
    }
  }
  return textLength;
}