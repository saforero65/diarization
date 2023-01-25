const fs = require("fs");
const srtparsejs = require("srtparsejs");

function subripToSeconds(subripTime) {
  let time = subripTime.split(":");
  let hours = parseInt(time[0]);
  let minutes = parseInt(time[1]);
  let seconds = parseInt(time[2].split(",")[0]);
  let milliseconds = parseInt(time[2].split(",")[1]);
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}
function secondsToSubrip(seconds) {
  var hour = Math.floor(seconds / 3600);
  var minute = Math.floor((seconds % 3600) / 60);
  var second = Math.floor(seconds % 60);
  var millisecond = Math.floor((seconds % 1) * 1000);

  return (
    (hour > 9 ? hour : "0" + hour) +
    ":" +
    (minute > 9 ? minute : "0" + minute) +
    ":" +
    (second > 9 ? second : "0" + second) +
    "," +
    (millisecond > 99
      ? millisecond
      : millisecond > 9
      ? "0" + millisecond
      : "00" + millisecond)
  );
}
function srtToJson(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) reject(err);
      else {
        let parsed = srtparsejs.parse(data);
        parsed.forEach((item) => {
          item.startTime = subripToSeconds(item.startTime);
          item.endTime = subripToSeconds(item.endTime);
          item.speaker = "undefined";
        });
        resolve(parsed);
      }
    });
  });
}
function readJson(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data));
    });
  });
}

function joinRTTM_SRT(srt, rttm) {
  let holgura = 1;

  rttm.forEach((item) => {
    let start = item.start;
    let end = item.stop;
    let speaker = item.speaker;
    srt.forEach((sub) => {
      if (start - holgura <= sub.startTime && end + holgura >= sub.endTime) {
        sub.speaker = speaker;
      }
    });
  });

  return srt;
}

srtToJson("mutefire.srt")
  .then((srtJson) => {
    readJson("mutefirev2.json")
      .then((dataJson) => {
        let joined = joinRTTM_SRT(srtJson, dataJson);
        // fs.writeFile("join.json", JSON.stringify(joined), (err) => {
        //   if (err) console.log(err);
        //   else console.log("File saved");
        // });
        filterSrtBySpeaker(joined, "speaker", "speakers");
      })
      .catch((err) => console.log(err));
  })
  .catch((err) => console.log(err));

function filterSrtBySpeaker(json, speakerAttr, outputPath) {
  //filter() para crear un arreglo con los objetos que contengan el atributo especificado.
  let speakers = json.filter((item) => item[speakerAttr]);
  // metodo map para obtener un arreglo con todos los valores del atributo buscado y luego se utiliza el metodo Set para crear un arreglo con valores unicos del atributo buscado.
  let uniqueSpeakers = [...new Set(speakers.map((item) => item[speakerAttr]))];
  //Se recorre el arreglo con valores unicos del atributo buscado.
  uniqueSpeakers.forEach((speaker) => {
    //Se crea un nuevo arreglo con los objetos que contengan el valor del atributo buscado.
    let speakerJson = json.filter((item) => item[speakerAttr] === speaker);

    speakerJson.forEach((item) => {
      item.startTime = secondsToSubrip(item.startTime);
      item.endTime = secondsToSubrip(item.endTime);
      item.text = item.speaker + ": " + item.text;
      delete item.speaker;
    });
    console.log(speakerJson);
    fs.writeFile(
      `${outputPath}/${speaker}.srt`,
      srtparsejs.toSrt(speakerJson),
      (err) => {
        if (err) throw err;
        console.log(`Archivo ${speaker}.srt creado`);
      }
    );
  });
}
