from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from database import get_db
from models.node import Node, NodeCreate
from routes.auth import get_current_user
import uuid

router = APIRouter()

@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
async def get_nodes(current_user = Depends(get_current_user)):
    db = get_db()
    nodes = []
    if db is not None:
        nodes = await db.nodes.find().to_list(1000)
        for n in nodes:
            if "_id" in n:
                n["_id"] = str(n["_id"])
                
    return nodes

@router.post("", response_model=Dict[str, Any])
@router.post("/", response_model=Dict[str, Any])
async def register_node(node_in: NodeCreate, current_user = Depends(get_current_user)):
    db = get_db()
    
    # Generate unique ID and API key for the new node
    node_id = f"N{str(uuid.uuid4())[:8].upper()}"
    api_key = f"ak_{uuid.uuid4().hex}"
    
    node_dict = node_in.model_dump()
    node_dict["_id"] = node_id
    node_dict["id"] = node_id
    node_dict["api_key"] = api_key
    node_dict["status"] = "normal"
    
    if db is not None:
        await db.nodes.insert_one(node_dict)
        created_node = await db.nodes.find_one({"_id": node_id})
        if created_node and "_id" in created_node:
            created_node["_id"] = str(created_node["_id"])
        return created_node or node_dict
    return node_dict
