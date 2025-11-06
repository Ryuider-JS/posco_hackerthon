import json
import urllib.request

def main():
    url = "http://localhost:8000/api/bedrock/agent-notify"
    payload = {
        "qcode": "Q12345",
        "productName": "NSK 609ZZ",
        "currentStock": 5,
        "minStock": 30,
        "unit": "EA",
        "agentId": "FVFAR7ILQW",
        "agentAliasId": "GDV3946APK",
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = resp.read().decode("utf-8", errors="ignore")
        print(body)

if __name__ == "__main__":
    main()


