"""Simple authenticated search across persisted workspace records."""
from fastapi import APIRouter, Depends, Query

from middleware.auth import get_current_user
from services.workspace_service import workspace_service


router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def search(query: str = Query(min_length=2, max_length=100), current_user=Depends(get_current_user)):
    needle = query.casefold()
    uid = current_user["uid"]
    sources = {
        "documents": workspace_service.DOCUMENTS,
        "team": workspace_service.TEAM,
        "calendar": workspace_service.CALENDAR,
        "notifications": workspace_service.NOTIFICATIONS,
    }
    results = []
    for source, collection in sources.items():
        for item in await workspace_service.list_records(collection, uid):
            searchable = " ".join(str(value) for key, value in item.items() if key not in {"content", "uid"})
            if needle in searchable.casefold():
                results.append({"type": source, "id": item["id"], "title": item.get("name") or item.get("title") or item.get("name") or item.get("id")})
    return {"success": True, "data": results[:50]}
