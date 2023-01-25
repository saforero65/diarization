import json
from datetime import datetime, timedelta


def seconds_to_subrip(time_in_seconds):
    # create a datetime object
    time = datetime(1,1,1) + timedelta(seconds=time_in_seconds)
    # format the time
    subrip_time = time.strftime("%H:%M:%S,%f")[:-3]
    return subrip_time

def subrip_to_seconds(subrip_time):
    time = datetime.strptime(subrip_time, "%H:%M:%S,%f")
    return time.hour*3600+time.minute*60+time.second
# Leer el archivo RTTM y almacenar la información en una lista de diccionarios
rttm = []
with open("mutefire.rttm", "r") as f:
    for line in f:
        elements = line.split()
        # Create an empty dictionary
        rttm_dict = {}
        # Assign values to the keys
        rttm_dict['file_name'] = elements[1]
        rttm_dict['channel_num'] = elements[2]
        rttm_dict['tbeg'] = seconds_to_subrip(float(elements[3]))
        rttm_dict['tfin'] = seconds_to_subrip(float(elements[3])+ float(elements[4]))
        rttm_dict['tdur'] = seconds_to_subrip(float(elements[4]))
        rttm_dict['speaker'] = elements[7]
        rttm.append(rttm_dict) # Append the dictionary to the list
        # print(rttm_dict)
        

# Close the file
f.close()
# print(rttm)

# Leer el archivo SRT y almacenar la información en una lista de diccionarios
srt_list = [] # create an empty list
with open('mutefire.srt', 'r') as srt:
    subtitle_num = None
    start_time = None
    end_time = None
    text = []
    for line in srt:
        line = line.strip() # remove leading and trailing whitespaces
        if line.isdigit():
            if subtitle_num is not None:
                srt_dict = {}
                srt_dict['subtitle_num'] = subtitle_num
                srt_dict['start_time'] = start_time
                srt_dict['end_time'] = end_time
                srt_dict['text'] = '\n'.join(text)
                srt_dict['speaker'] = None
                srt_list.append(srt_dict)
                # print(srt_dict)
                text = []
            subtitle_num = int(line)
        elif '-->' in line:
            start_time, end_time = line.split(' --> ')
        else:
            text.append(line)
    
    srt_dict = {}
    srt_dict['subtitle_num'] = subtitle_num
    srt_dict['start_time'] = start_time
    srt_dict['end_time'] = end_time
    srt_dict['text'] = '\n'.join(text)
    srt_list.append(srt_dict)
    

srt.close()


# Asignar la etiqueta del segmento RTTM al subtítulo correspondiente en el archivo SRT
# Escribir la información combinada en un nuevo archivo
with open("mutefire.json", "w") as file:    
    holgura=1
    for r in rttm:
        for s in srt_list:
            index=s["subtitle_num"]
            if index==703:
              print("El segmento en el srt:",s["subtitle_num"],"tiene como inicio:",subrip_to_seconds(s["start_time"]),"y como fin:",subrip_to_seconds(s["end_time"]))
              print("El segmento en el rttm:",r["file_name"],"tiene como inicio:",subrip_to_seconds(r["tbeg"]),"y como fin:",subrip_to_seconds(r["tfin"]))
              
            if subrip_to_seconds(r["tbeg"])-holgura <= subrip_to_seconds(s["start_time"]) and subrip_to_seconds(r["tfin"])+holgura >= subrip_to_seconds(s["end_time"]):
                s["speaker"] = r["speaker"] 
                
                # imprimir idice de la lista
                
            
                
    file.write(json.dumps(srt_list, indent=4))
                 




