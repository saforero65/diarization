const fs = require("fs");
const srtparsejs = require("srtparsejs");

// const AUDIO_JSON = "mutefirev2.json";
// const SUBTITLE_SRT = "mutefire.srt";

const AUDIO_JSON = "tolive2.json";
const SUBTITLE_SRT = "tolive.srt";

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

  rttm.segmentos.forEach((item) => {
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

function filterSrtBySpeaker(json, speakerAttr, outputPath) {
  const track = [];
  //filter() para crear un arreglo con los objetos que contengan el atributo especificado.
  let speakers = json.filter((item) => item[speakerAttr]);

  // metodo map para obtener un arreglo con todos los valores del atributo buscado y luego se utiliza el metodo Set para crear un arreglo con valores unicos del atributo buscado.
  let uniqueSpeakers = [...new Set(speakers.map((item) => item[speakerAttr]))];
  //Se recorre el arreglo con valores unicos del atributo buscado.
  uniqueSpeakers.forEach((speaker) => {
    //Se crea un nuevo arreglo con los objetos que contengan el valor del atributo buscado.
    let speakerJson = json.filter((item) => item[speakerAttr] === speaker);

    let copySpeakerJson = [
      {
        speaker: speaker,
        totalSegmentos: speakerJson.length,
        segmentosSRT: speakerJson,
      },
    ];
    track.push({
      speaker: speaker,
      totalSegmentos: speakerJson.length,
      segmentos: speakerJson,
    });
    //crear carpeta

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }

    fs.writeFile(
      `${outputPath}/${speaker}.json`,
      JSON.stringify(copySpeakerJson),
      (err) => {
        if (err) throw err;
        console.log(`Archivo ${speaker}.json creado`);
      }
    );

    speakerJson.forEach((item) => {
      item.startTime = secondsToSubrip(item.startTime);
      item.endTime = secondsToSubrip(item.endTime);
      item.text = item.speaker + ": " + item.text;
      delete item.speaker;
    });

    fs.writeFile(
      `${outputPath}/${speaker}.srt`,
      srtparsejs.toSrt(speakerJson),
      (err) => {
        if (err) throw err;
        console.log(`Archivo ${speaker}.srt creado`);
      }
    );
  });
  return track;
}

function compareAssignSpeaker(json) {
  json.forEach((item, index) => {
    if (item.speaker === "undefined") {
      //ver el objeto anterior y el siguiente y asignar si son iguales

      if (index > 0 && index < json.length - 1) {
        if (json[index - 1].speaker === json[index + 1].speaker) {
          item.speaker = json[index - 1].speaker;
        }
        //si los dos no son iguales ver el objeto anterior y asignar el speaker
        else if (json[index - 1].speaker !== json[index + 1].speaker) {
          item.speaker = json[index - 1].speaker;
        }
        //si el objeto anterior no tiene speaker asignar el del siguiente
      } else if (index === 0) {
        item.speaker = json[index + 1].speaker;
        //si el siguiente es undefined seguir hasta encontrar un speaker
        if (item.speaker === "undefined") {
          let i = 1;
          while (item.speaker === "undefined") {
            item.speaker = json[index + i].speaker;
            i++;
          }
        }
      } else {
        item.speaker = json[index - 1].speaker;
      }
    }
  });
  return json;
}

//iterar sobre todos los json

for (let i = 8000; i <= 23000; i += 1000) {
  srtToJson(SUBTITLE_SRT)
    .then((srtJson) => {
      readJson("../pyannote_diarization/outputToLive/tolive_" + i + ".json")
        .then((dataJson) => {
          let joined = joinRTTM_SRT(srtJson, dataJson);
          const undefendedAssigned = compareAssignSpeaker(joined);

          fs.writeFile(
            `joined_json/joinSRT&RTTM_${i}.json`,
            JSON.stringify(undefendedAssigned),
            (err) => {
              if (err) console.log(err);
              else
                console.log(` Archivo joined/joinSRT&RTTM_${i}.json  CREADO`);
            }
          );

          const copyJoined = JSON.parse(JSON.stringify(undefendedAssigned));
          copyJoined.forEach((item) => {
            item.startTime = secondsToSubrip(item.startTime);
            item.endTime = secondsToSubrip(item.endTime);
            item.text = item.speaker + ": " + item.text;
            delete item.speaker;
          });

          fs.writeFile(
            `joined_srt/joinSRT&RTTM_${i}.srt`,
            srtparsejs.toSrt(copyJoined),
            (err) => {
              if (err) console.log(err);
              else
                console.log(`Archivo joined_srt/joinSRT&RTTM_${i}.srt CREADO`);
            }
          );

          const track = filterSrtBySpeaker(
            joined,
            "speaker",
            `spespeakersToLive_${i}`
          );

          const json = { totalSegmentos: joined.length, track: track };
          fs.writeFile(
            `trackData/trackDataSRT_${i}.json`,
            JSON.stringify(json),
            (err) => {
              if (err) console.log(err);
              else
                console.log(`Archivo trackData/trackDataSRT_${i}.json CREADO`);
            }
          );
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
}
