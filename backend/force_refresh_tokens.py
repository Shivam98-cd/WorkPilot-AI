"""Force refresh all expired Gmail tokens"""
import asyncio
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv('.env')


async def main():
    """Force refresh expired tokens for all Gmail integrations."""
    from firebase.admin_config import initialize_firebase
    initialize_firebase()
    from firebase.firestore import firestore_service
    from repositories.integration_repository import integration_repository
    from services.integration_service import integration_service
    
    print('🔄 Force Refresh Gmail Tokens')
    print('='*70)
    
    # Get all Gmail integrations
    rows = await firestore_service.query_documents('user_integrations', filters=[('platform', '==', 'gmail')])
    
    if not rows:
        print('❌ No Gmail integrations found')
        return
    
    print(f'✅ Found {len(rows)} Gmail integration(s)\n')
    
    refreshed_count = 0
    failed_count = 0
    
    for idx, row in enumerate(rows, 1):
        uid = row.get('uid')
        account = row.get('accountLabel', 'Unknown')
        status = row.get('status', 'Unknown')
        token_expires = row.get('tokenExpiresAt')
        
        print(f'{idx}. Checking integration:')
        print(f'   User ID: {uid}')
        print(f'   Account: {account}')
        print(f'   Status: {status}')
        
        # Check if token is expired
        is_expired = False
        if token_expires:
            try:
                if isinstance(token_expires, str):
                    from dateutil import parser
                    expires_dt = parser.isoparse(token_expires)
                    if expires_dt.tzinfo is None:
                        expires_dt = expires_dt.replace(tzinfo=timezone.utc)
                else:
                    expires_dt = token_expires
                    if hasattr(expires_dt, 'timestamp'):
                        expires_dt = datetime.fromtimestamp(expires_dt.timestamp(), tz=timezone.utc)
                
                now = datetime.now(timezone.utc)
                
                if expires_dt < now:
                    is_expired = True
                    time_ago = (now - expires_dt).total_seconds() / 60
                    print(f'   ⚠️  Token: EXPIRED ({time_ago:.0f} minutes ago)')
                else:
                    time_left = (expires_dt - now).total_seconds() / 60
                    print(f'   ✅ Token: Valid ({time_left:.0f} minutes left)')
            except Exception as e:
                print(f'   ⚠️  Could not check token expiry: {e}')
                is_expired = True
        else:
            print(f'   ⚠️  No token expiration info')
            is_expired = True
        
        # Try to refresh token
        if is_expired or status != 'connected':
            print(f'   🔄 Attempting to refresh token...')
            try:
                # Get the integration record
                record = await integration_repository.get(uid, 'gmail')
                
                if record and record.refresh_token_enc:
                    # Force token refresh
                    token = await integration_service._get_valid_google_token(uid, 'gmail', record)
                    
                    if token:
                        print(f'   ✅ Token refreshed successfully!')
                        print(f'      New token: {token[:30]}...')
                        refreshed_count += 1
                        
                        # Test the token with a simple API call
                        import httpx
                        async with httpx.AsyncClient() as client:
                            response = await client.get(
                                "https://gmail.googleapis.com/gmail/v1/users/me/profile",
                                headers={"Authorization": f"Bearer {token}"}
                            )
                            if response.status_code == 200:
                                profile = response.json()
                                print(f'      ✅ Token validated: {profile.get("emailAddress")}')
                            else:
                                print(f'      ⚠️  Token validation failed: {response.status_code}')
                                failed_count += 1
                    else:
                        print(f'   ❌ Token refresh returned empty token')
                        failed_count += 1
                else:
                    print(f'   ❌ No refresh token available - user must reconnect')
                    failed_count += 1
                    
            except Exception as e:
                print(f'   ❌ Refresh failed: {type(e).__name__}: {e}')
                failed_count += 1
        
        print()
    
    print('='*70)
    print(f'Summary:')
    print(f'  ✅ Refreshed: {refreshed_count}')
    print(f'  ❌ Failed: {failed_count}')
    print(f'  📊 Total: {len(rows)}')
    
    if failed_count > 0:
        print(f'\n💡 Note: Failed integrations need user reconnection via frontend')
    
    print('='*70)


if __name__ == '__main__':
    asyncio.run(main())
