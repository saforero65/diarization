FROM python:3.8

WORKDIR /usr/src/app

COPY escribirJSON.py .
COPY conversacion.wav .
COPY mutefire.wav .
COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install sox
RUN pip install PySoundFile

RUN apt-get update && apt-get install -y libsndfile1
RUN pip install -r requirements.txt

CMD [ "python", "./escribirJSON.py" ]