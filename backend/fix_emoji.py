import os, re

files = [
    r'D:\workpilot-ai\backend\api\v1\endpoints\ai_chat.py',
    r'D:\workpilot-ai\backend\api\v1\endpoints\emails.py',
    r'D:\workpilot-ai\backend\api\v1\endpoints\integrations.py',
    r'D:\workpilot-ai\backend\api\v1\endpoints\users.py',
    r'D:\workpilot-ai\backend\middleware\auth.py',
    r'D:\workpilot-ai\backend\middleware\logging.py',
    r'D:\workpilot-ai\backend\services\auth_service.py',
    r'D:\workpilot-ai\backend\services\integration_service.py',
    r'D:\workpilot-ai\backend\firebase\admin_config.py',
    r'D:\workpilot-ai\backend\App.jsx',
]

replacements = [
    ('\U0001f510', '[AUTH]'),
    ('\U0001f504', '[SYNC]'),
    ('\U0001f512', '[LOCK]'),
    ('\U0001f513', '[UNLOCK]'),
    ('\U0001f680', '[DEPLOY]'),
    ('\U0001f4e7', '[EMAIL]'),
    ('\U0001f4cb', '[NOTE]'),
    ('\u2705', '[OK]'),
    ('\u274c', '[ERR]'),
    ('\u26a0\ufe0f', '[WARN]'),
    ('\u26a0', '[WARN]'),
    ('\u2714', '[OK]'),
    ('\u2728', '[*]'),
    ('\u2192', '->'),
    ('\u2190', '<-'),
    ('\ufe0f', ''),  # variation selector - strip it
]

for fpath in files:
    if not os.path.exists(fpath):
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for emoji, replacement in replacements:
        content = content.replace(emoji, replacement)
    if content != original:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed: {fpath}')
    else:
        print(f'Clean: {fpath}')

print('Done.')
