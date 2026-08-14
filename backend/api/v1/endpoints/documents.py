import hashlib
from fastapi import APIRouter, Depends, UploadFile, File
from core.exceptions import ValidationException
from middleware.auth import get_current_user
from services.workspace_service import workspace_service

router = APIRouter(prefix='/documents', tags=['documents'])
MAX_DOCUMENT_BYTES = 750_000

@router.get('')
async def get_documents(current_user=Depends(get_current_user)):
    return {'success': True, 'data': await workspace_service.list_records(workspace_service.DOCUMENTS, current_user['uid'])}

@router.post('/upload')
async def upload_document(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    content = await file.read()
    if len(content) > MAX_DOCUMENT_BYTES:
        raise ValidationException('Document is too large for the configured document store (750 KB max)')
    try:
        text = content.decode('utf-8')
    except UnicodeDecodeError:
        text = ''
    document = await workspace_service.create_record(workspace_service.DOCUMENTS, current_user['uid'], {
        'name': file.filename or 'untitled', 'size': len(content), 'contentType': file.content_type,
        'content': text, 'sha256': hashlib.sha256(content).hexdigest(),
    })
    document.pop('content', None)
    return {'success': True, 'data': document}

@router.post('/ask')
async def ask_document(body: dict, current_user=Depends(get_current_user)):
    doc_id = body.get('doc_id')
    question = (body.get('question') or '').strip()
    if not question:
        raise ValidationException('A question is required')
    document = await workspace_service.get_record(workspace_service.DOCUMENTS, current_user['uid'], doc_id)
    content = document.get('content', '')
    if not content:
        raise ValidationException('Only UTF-8 text documents can be queried until a document extraction provider is configured')
    terms = [term.lower() for term in question.split() if len(term) > 2]
    excerpts = [line.strip() for line in content.splitlines() if any(term in line.lower() for term in terms)]
    answer = '\n'.join(excerpts[:3]) or 'No matching text was found in this document.'
    return {'success': True, 'data': {'answer': answer, 'documentId': doc_id}}
