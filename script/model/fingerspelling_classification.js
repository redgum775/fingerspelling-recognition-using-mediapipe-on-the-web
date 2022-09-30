export class JaSpellingClassification{
  constructor(){
    this.modelLoad()
    this.mean =
            [
                    123.7070160955089, 123.76988167249152, 121.38702829594689,
                    110.0945749155376, 111.92034973308382, 118.72344514259282,
                    106.98324145412145, 99.27857078360852, 117.14142600863752,
                    94.99213925775423, 95.25221262032412, 118.08361918591446,
                    97.1594160914552, 103.40558886846009, 108.58942037122917,
                    201.61999962677106, 0.5525192448516673, 0.050026022099458396,
                    0.05498236184424018, 0.032413237595213244
            ];
    this.scale =
            [
                    64.74302376480547, 64.55824398419959, 63.940993238974244,
                    60.25073589911224, 62.346802638936914, 62.649333738445925,
                    58.89864751115622, 57.358427238567764, 64.1768068535452,
                    55.19474724125257, 55.12512080776267, 63.086799761283984,
                    55.37028329052023, 57.89466269624247, 59.282691824337086,
                    122.17235154685915, 0.4972340785990142, 0.03451858199981021,
                    0.03914316214105014, 0.03143124562422413
            ];
    this.timestep = 10;
    this.inputData = [];
  }

  async modelLoad(){
    this.model = await tflite.loadTFLiteModel('./script/model/ja_fingerspelling.tflite');
  }

  classification(){
    if(this.inputData.length == 10){
      const input = tf.tensor3d([this.inputData]);
      const result = this.model.predict(input).arraySync();
      return this.indices_char(this.maxIndex(result[0]));
    }else{
      return this.indices_char(46);
    }
  }

  updateInputData(explanatoryVariable){
    let standardizedExplanatoryVariable = [];
    for(let i = 0; i < 20; i++){
      standardizedExplanatoryVariable.push((explanatoryVariable[i] - this.mean[i]) / this.scale[i]);
    }
    this.inputData.push(standardizedExplanatoryVariable);
    if(this.inputData.length > this.timestep){
      this.inputData.shift();
    }
  }

  maxIndex(values) {
    let index = 0;
    let max_value = 0;
    for (let i = 0; i < values.length; i++) {
      if (max_value < values[i]) {
        max_value = values[i];
        index = i;
      }
    }
    return index;
  }

  indices_char(index){
    const char = [
          'あ','い','う','え','お',
          'か','き','く','け','こ',
          'さ','し','す','せ','そ',
          'た','ち','つ','て','と',
          'な','に','ぬ','ね','の',
          'は','ひ','ふ','へ','ほ',
          'ま','み','む','め','も',
          'や','ゆ','よ',
          'ら','り','る','れ','ろ',
          'わ','を','ん',
          '_'];
    return char[index];
  }
}