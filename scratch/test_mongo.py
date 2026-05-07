import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def test_conn():
    uri = "mongodb+srv://Sahanashre_ind-data:Indegene@7481@cluster0.5cdvrf5.mongodb.net/"
    print(f"Testing URI: {uri}")
    client = AsyncIOMotorClient(uri)
    try:
        # The ismaster command is cheap and does not require auth.
        await client.admin.command('ismaster')
        print("✅ Connection successful!")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("Trying with encoded @...")
        uri_encoded = "mongodb+srv://Sahanashre_ind-data:Indegene%407481@cluster0.5cdvrf5.mongodb.net/"
        client_encoded = AsyncIOMotorClient(uri_encoded)
        try:
            await client_encoded.admin.command('ismaster')
            print("✅ Connection successful with encoded @!")
        except Exception as e2:
            print(f"❌ Connection failed even with encoded @: {e2}")

if __name__ == "__main__":
    asyncio.run(test_conn())
