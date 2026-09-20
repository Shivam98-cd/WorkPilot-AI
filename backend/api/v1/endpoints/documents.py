import hashlib
from fastapi import APIRouter, Depends, UploadFile, File
from core.exceptions import ValidationException
from middleware.auth import get_current_user
from services.workspace_service import workspace_service
from services.vector_knowledge_service import vector_knowledge_service, extract_text_from_bytes

router = APIRouter(prefix='/documents', tags=['documents'])
MAX_DOCUMENT_BYTES = 1_500_000  # Upgraded to 1.5MB for multi-page PDFs


@router.get('')
async def get_documents(current_user=Depends(get_current_user)):
    return {'success': True, 'data': await workspace_service.list_records(workspace_service.DOCUMENTS, current_user['uid'])}


@router.post('/upload')
async def upload_document(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    content = await file.read()
    if len(content) > MAX_DOCUMENT_BYTES:
        raise ValidationException('Document is too large (1.5 MB max limit)')

    filename = file.filename or 'untitled'
    content_type = file.content_type or 'application/octet-stream'

    # Extract text from bytes using pypdf / utf-8 / fallback
    text = extract_text_from_bytes(content, filename=filename, content_type=content_type)

    document = await workspace_service.create_record(workspace_service.DOCUMENTS, current_user['uid'], {
        'name': filename,
        'size': len(content),
        'contentType': content_type,
        'content': text,
        'sha256': hashlib.sha256(content).hexdigest(),
        'status': 'Indexed' if text.strip() else 'Processed',
    })

    # Index into Vector Knowledge Store for semantic RAG retrieval
    doc_id = document.get('id')
    if doc_id and text.strip():
        vector_knowledge_service.index_document(
            uid=current_user['uid'],
            doc_id=doc_id,
            title=filename,
            text=text,
            metadata={'contentType': content_type, 'size': len(content)},
        )

    document.pop('content', None)
    return {'success': True, 'data': document}


@router.post('/ask')
async def ask_document(body: dict, current_user=Depends(get_current_user)):
    doc_id = body.get('doc_id')
    question = (body.get('question') or '').strip()
    if not question:
        raise ValidationException('A question is required')

    uid = current_user['uid']
    document = await workspace_service.get_record(workspace_service.DOCUMENTS, uid, doc_id)
    content = document.get('content', '')

    # Ensure document is in vector store
    if doc_id and content:
        vector_knowledge_service.index_document(
            uid=uid,
            doc_id=doc_id,
            title=document.get('name', 'Document'),
            text=content,
        )

    # Semantic RAG retrieval
    result = vector_knowledge_service.answer_query(uid=uid, doc_id=doc_id, question=question)

    return {
        'success': True,
        'data': {
            'answer': result['answer'],
            'sources': result.get('sources', []),
            'documentId': doc_id,
        },
    }


@router.post('/semantic-search')
async def semantic_search(body: dict, current_user=Depends(get_current_user)):
    query = (body.get('query') or '').strip()
    if not query:
        raise ValidationException('A query is required')

    uid = current_user['uid']
    top_k = int(body.get('top_k', 5))
    doc_id = body.get('doc_id')

    # Pre-index any unindexed user documents
    docs = await workspace_service.list_records(workspace_service.DOCUMENTS, uid)
    for d in docs:
        if d.get('id') and d.get('content'):
            vector_knowledge_service.index_document(
                uid=uid,
                doc_id=d['id'],
                title=d.get('name', 'Doc'),
                text=d['content'],
            )

    results = vector_knowledge_service.semantic_search(uid=uid, query=query, top_k=top_k, doc_id=doc_id)
    return {'success': True, 'data': results}


@router.delete('/{doc_id}')
async def delete_document(doc_id: str, current_user=Depends(get_current_user)):
    uid = current_user['uid']
    await workspace_service.delete_record(workspace_service.DOCUMENTS, uid, doc_id)
    vector_knowledge_service.delete_document(uid, doc_id)
    return {'success': True}



