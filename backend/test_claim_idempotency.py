import asyncio
import httpx
import sqlite3
import uuid

API_BASE_URL = "http://127.0.0.1:8000"
DB_PATH = "proofchain.db"

async def run_tests():
    print("==================================================")
    print("PROOFCHAIN AI — CLAIM SUBMISSION & IDEMPOTENCY TEST")
    print("==================================================")
    
    # 1. Test backend health
    async with httpx.AsyncClient() as client:
        health_resp = await client.get(f"{API_BASE_URL}/health")
        print(f"1. Health Check: Status {health_resp.status_code} => {health_resp.json()}")
        assert health_resp.status_code == 200

    # 2. Test 10 Rapid Clicks with the same submission & Idempotency Key
    print("\n--------------------------------------------------")
    print("2. Executing 10 Rapid Concurrent Submissions for Claim 1")
    claim_1_title = "Waterlogging during heavy rainfall"
    claim_1_desc = "This location repeatedly experiences waterlogging during heavy rainfall."
    idempotency_key_1 = str(uuid.uuid4())
    print(f"Claim 1 Idempotency Key: {idempotency_key_1}")

    async def submit_claim_1(request_idx: int):
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{API_BASE_URL}/claims",
                headers={"Idempotency-Key": idempotency_key_1},
                json={
                    "title": claim_1_title,
                    "description": claim_1_desc,
                    "status": "pending",
                    "idempotency_key": idempotency_key_1,
                },
                timeout=10.0,
            )
            return request_idx, resp.status_code, resp.json()

    # Launch 10 simultaneous requests
    tasks = [submit_claim_1(i + 1) for i in range(10)]
    results = await asyncio.gather(*tasks)

    print("\nResults of 10 Rapid Clicks:")
    returned_claim_ids = set()
    for req_idx, status_code, data in results:
        cid = data.get("claim_id") or f"CLM-2026-{str(data.get('id')).zfill(4)}"
        returned_claim_ids.add(cid)
        print(f"  Request #{req_idx:02d}: HTTP {status_code} -> Claim ID: {cid}")

    print(f"\nUnique Claim IDs returned across 10 rapid requests: {returned_claim_ids}")
    assert len(returned_claim_ids) == 1, f"Expected 1 unique claim ID, got {len(returned_claim_ids)}"
    created_claim_1_id = list(returned_claim_ids)[0]
    print(f"SUCCESS: All 10 rapid submissions resolved to single record: {created_claim_1_id}")

    # 3. Direct SQLite Verification for Claim 1
    print("\n--------------------------------------------------")
    print("3. SQLite Direct Database Verification for Claim 1")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, description, status, idempotency_key FROM claims WHERE idempotency_key = ?", (idempotency_key_1,))
    rows = cursor.fetchall()
    print(f"Direct DB Query: Found {len(rows)} matching record(s) with key {idempotency_key_1}")
    for row in rows:
        print(f"  DB Record: ID={row[0]}, Title='{row[1]}', Status='{row[3]}', Key='{row[4]}'")
    assert len(rows) == 1, f"Expected exactly 1 DB record, found {len(rows)}"

    # 4. Test Normal Submission for a DIFFERENT Legitimate Claim 2
    print("\n--------------------------------------------------")
    print("4. Executing Normal Submission for Legitimate Claim 2")
    claim_2_title = "Damaged road near school"
    claim_2_desc = "Severe potholes and broken asphalt near the primary school entrance pose hazard to pedestrian traffic."
    idempotency_key_2 = str(uuid.uuid4())
    print(f"Claim 2 Idempotency Key: {idempotency_key_2}")

    async with httpx.AsyncClient() as client:
        resp_2 = await client.post(
            f"{API_BASE_URL}/claims",
            headers={"Idempotency-Key": idempotency_key_2},
            json={
                "title": claim_2_title,
                "description": claim_2_desc,
                "status": "pending",
                "idempotency_key": idempotency_key_2,
            },
            timeout=10.0,
        )
        data_2 = resp_2.json()
        claim_2_id = data_2.get("claim_id") or f"CLM-2026-{str(data_2.get('id')).zfill(4)}"
        print(f"Claim 2 Response: HTTP {resp_2.status_code} -> Claim ID: {claim_2_id}")

    assert claim_2_id != created_claim_1_id, "Claim 2 must have a different ID from Claim 1"

    # 5. Direct SQLite Verification for Claim 2
    cursor.execute("SELECT id, title, description, status, idempotency_key FROM claims WHERE idempotency_key = ?", (idempotency_key_2,))
    rows_2 = cursor.fetchall()
    print(f"Direct DB Query: Found {len(rows_2)} matching record(s) with key {idempotency_key_2}")
    for row in rows_2:
        print(f"  DB Record: ID={row[0]}, Title='{row[1]}', Status='{row[3]}', Key='{row[4]}'")
    assert len(rows_2) == 1, f"Expected exactly 1 DB record for Claim 2, found {len(rows_2)}"

    # Summary of all claims in DB
    cursor.execute("SELECT id, title, idempotency_key, created_at FROM claims ORDER BY id DESC LIMIT 5")
    recent = cursor.fetchall()
    print("\n--------------------------------------------------")
    print("Recent Claims in Database:")
    for r in recent:
        print(f"  CLM-2026-{str(r[0]).zfill(4)} | {r[1]} | Key: {r[2]}")
    conn.close()

    print("\n==================================================")
    print("ALL IDEMPOTENCY & DUPLICATE PREVENTION TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
