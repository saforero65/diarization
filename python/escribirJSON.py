import json

from pyannote.audio import Pipeline

#Se crea una instancia de la clase Pipeline utilizando el modelo pre-entrenado "pyannote/speaker-diarization" y se asigna el resultado a la variable pipeline. El token se utiliza para autenticarse en el servidor que proporciona el modelo pre-entrenado.
pipeline = Pipeline.from_pretrained("pyannote/speaker-diarization",
                                    use_auth_token="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")

diarization = pipeline("../mutefire.wav")

data = []    
#se recorre cada track de la diarización utilizando el método itertracks y se asigna cada valor a las variables turn, _ y speaker. El yield_label=True indica que se desea acceder a la etiqueta del hablante en cada iteracion.
for turn, _, speaker in diarization.itertracks(yield_label=True):
    
    line= {"start": turn.start, "stop": turn.end, "speaker": speaker}    
    data.append(line)

with open("mutefirev2.json", "w") as file:
    file.write(json.dumps(data, indent=4))