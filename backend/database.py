import os
import json
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

logger = logging.getLogger("InsightX.Database")

class LocalCollection:
    """Fallback thread-safe local file/memory store if MongoDB is offline."""
    def __init__(self, name: str, data_dir: str = "./data_store"):
        self.name = name
        self.data_dir = data_dir
        os.makedirs(self.data_dir, exist_ok=True)
        self.file_path = os.path.join(self.data_dir, f"{name}.json")
        self._data: Dict[str, Dict[str, Any]] = self._load()

    def _load(self) -> Dict[str, Dict[str, Any]]:
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading local store {self.name}: {e}")
        return {}

    def _save(self):
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving local store {self.name}: {e}")

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for item in self._data.values():
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                return item.copy()
        return None

    async def find_many(self, query: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        query = query or {}
        results = []
        for item in self._data.values():
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                results.append(item.copy())
        return results

    async def insert_one(self, doc: Dict[str, Any]) -> str:
        doc_id = doc.get("id") or str(uuid.uuid4())
        doc["id"] = doc_id
        if "_id" not in doc:
            doc["_id"] = doc_id
        self._data[doc_id] = doc
        self._save()
        return doc_id

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]) -> bool:
        doc = await self.find_one(query)
        if not doc:
            return False
        doc_id = doc.get("id") or doc.get("_id")
        set_data = update.get("$set", update)
        self._data[doc_id].update(set_data)
        self._save()
        return True

    async def delete_one(self, query: Dict[str, Any]) -> bool:
        doc = await self.find_one(query)
        if not doc:
            return False
        doc_id = doc.get("id") or doc.get("_id")
        del self._data[doc_id]
        self._save()
        return True

    @staticmethod
    def utcnow() -> str:
        return datetime.now(timezone.utc).isoformat()


class DatabaseManager:
    """Manages Async MongoDB Motor client with transparent local persistence fallback."""
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.is_connected: bool = False
        self.fallback_collections: Dict[str, LocalCollection] = {}

    async def initialize(self):
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2500)
            # Ping connection
            await self.client.admin.command('ping')
            self.db = self.client.get_default_database("insightx")
            self.is_connected = True
            logger.info("Successfully connected to MongoDB server.")
        except Exception as e:
            logger.warning(f"MongoDB connection failed ({e}). Initializing high-performance local store fallback.")
            self.is_connected = False
            for col_name in ["users", "projects", "predictions", "alerts"]:
                self.fallback_collections[col_name] = LocalCollection(col_name)

    def get_collection(self, collection_name: str):
        if self.is_connected and self.db is not None:
            return MongoCollectionWrapper(self.db[collection_name])
        else:
            if collection_name not in self.fallback_collections:
                self.fallback_collections[collection_name] = LocalCollection(collection_name)
            return self.fallback_collections[collection_name]


class MongoCollectionWrapper:
    """Wrapper to standardize Async Motor collection interface."""
    def __init__(self, collection):
        self._col = collection

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await self._col.find_one(query)

    async def find_many(self, query: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        query = query or {}
        cursor = self._col.find(query)
        return await cursor.to_list(length=100)

    async def insert_one(self, doc: Dict[str, Any]) -> str:
        doc_id = doc.get("id") or str(uuid.uuid4())
        doc["id"] = doc_id
        if "_id" not in doc:
            doc["_id"] = doc_id
        res = await self._col.insert_one(doc)
        return doc_id

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]) -> bool:
        res = await self._col.update_one(query, update)
        return res.modified_count > 0

    async def delete_one(self, query: Dict[str, Any]) -> bool:
        res = await self._col.delete_one(query)
        return res.deleted_count > 0

    @staticmethod
    def utcnow() -> str:
        return datetime.now(timezone.utc).isoformat()


db_manager = DatabaseManager()
