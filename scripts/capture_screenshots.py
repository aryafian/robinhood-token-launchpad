import asyncio
import json
import os
import subprocess
import time
import base64
import requests
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
SCREENSHOT_DIR = r"e:\Web3\screenshots"
PUBLIC_SCREENSHOT_DIR = r"e:\Web3\launchpad\public\screenshots"

async def send_cmd(ws, method, params=None, msg_id=[1]):
    mid = msg_id[0]
    msg_id[0] += 1
    req = {"id": mid, "method": method, "params": params or {}}
    await ws.send(json.dumps(req))
    while True:
        resp = json.loads(await ws.recv())
        if resp.get("id") == mid:
            return resp.get("result", {})

async def capture_png(ws, filename):
    res = await send_cmd(ws, "Page.captureScreenshot", {"format": "png"})
    data = base64.b64decode(res["data"])
    path1 = os.path.join(SCREENSHOT_DIR, filename)
    path2 = os.path.join(PUBLIC_SCREENSHOT_DIR, filename)
    with open(path1, "wb") as f:
        f.write(data)
    with open(path2, "wb") as f:
        f.write(data)
    print(f"Saved screenshot: {filename} ({len(data)} bytes)")

async def evaluate(ws, expr):
    res = await send_cmd(ws, "Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})
    return res.get("result", {}).get("value")

async def main():
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--window-size=1440,1050",
        "http://localhost:3000"
    ])
    time.sleep(3)

    try:
        tabs = requests.get("http://localhost:9222/json").json()
        page_tab = [t for t in tabs if t.get("type") == "page"][0]
        ws_url = page_tab["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url, max_size=20*1024*1024) as ws:
            await send_cmd(ws, "Page.enable")
            await send_cmd(ws, "Runtime.enable")

            # 1. Wait for tokens to load
            print("Waiting for token cards...")
            for _ in range(20):
                count = await evaluate(ws, "document.querySelectorAll('.token-card').length")
                if count and count > 0:
                    print(f"Found {count} token cards!")
                    break
                await asyncio.sleep(1)

            await asyncio.sleep(2)
            await capture_png(ws, "01-token-list.png")

            # 2. Click Buy on first active token
            print("Opening Buy modal...")
            await evaluate(ws, """
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Buy $'));
                if (btn) btn.click();
            """)
            await asyncio.sleep(1.5)

            # Click the quick chip '0.005 ETH'
            await evaluate(ws, """
                const chip = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('0.005 ETH'));
                if (chip) chip.click();
            """)
            await asyncio.sleep(1)
            await capture_png(ws, "02-buy-modal.png")

            # Close modal
            await evaluate(ws, """
                const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '✕');
                if (closeBtn) closeBtn.click();
            """)
            await asyncio.sleep(1)

            # 3. Open Details modal
            print("Opening Details modal...")
            await evaluate(ws, """
                const detailsBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Details');
                if (detailsBtn) detailsBtn.click();
            """)
            await asyncio.sleep(2)
            await capture_png(ws, "03-token-details.png")

            # Close details modal
            await evaluate(ws, """
                const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '✕');
                if (closeBtn) closeBtn.click();
            """)
            await asyncio.sleep(1)

            # 4. Open Launch Token modal
            print("Opening Launch Token modal...")
            await evaluate(ws, """
                const launchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Launch Token'));
                if (launchBtn) launchBtn.click();
            """)
            await asyncio.sleep(1.5)
            await capture_png(ws, "04-launch-token-modal.png")

            print("All screenshots successfully captured with quick chip calculation!")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(main())
