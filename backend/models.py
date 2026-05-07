import os
from pymongo import MongoClient

# MongoDB URI from user (should be kept secret in real projects)
MONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://Sahanashre_ind-data:Indegene@7481@cluster0.5cdvrf5.mongodb.net/')

client = MongoClient(MONGO_URI)
# Database name can be "dailytrack" (or any name you prefer)
_db = client['dailytrack']

# Collection for work logs
def get_collection():
    return _db['worklogs']
