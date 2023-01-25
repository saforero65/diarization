import json

import boto3

s3_client = boto3.client('s3')

def lambda_handler(event, context):
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key'] 
        
        print("BUCKET:" +str(bucket))
        print("ARCHIVO:" +str(key))
        
    
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
