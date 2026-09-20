import httpx
import asyncio
import uuid
import sqlite3
import json


async def run_duplicate_and_normal_tests():
    client = httpx.AsyncClient(base_url="http://127.0.0.1:8000")

    # Count before
    conn = sqlite3.connect("proofchain.db")
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM claims")
    count_before = cursor.fetchone()[0]
    print(f"=== Initial Claims in DB: {count_before} ===\n")

    # TEST A & B: 10 Rapid Submissions for Claim 1 with same idempotency key
    print('--- TEST 1: 10 Rapid Submissions of "Waterlogging during heavy rainfall" ---')
    submission_key_1 = str(uuid.uuid4())
    payload_1 = {
        "title": "Waterlogging during heavy rainfall",
        "description": "This location repeatedly experiences waterlogging during heavy rainfall.",
        "status": "pending",
        "idempotency_key": submission_key_1,
    }
    headers_1 = {"Idempotency-Key": submission_key_1}

    # Dispatch 10 concurrent requests at the exact same instant
    tasks = [
        client.post("/claims", json=payload_1, headers=headers_1)
        for _ in range(10)
    ]
    responses_1 = await asyncio.gather(*tasks)

    # Collect responses
    status_codes = [r.status_code for r in responses_1]
    claim_ids = [r.json()["claim_id"] for r in responses_1]
    numeric_ids = [r.json()["id"] for r in responses_1]

    print(f"10 Response Status Codes: {set(status_codes)}")
    print(f"Unique Claim IDs returned across 10 requests: {set(claim_ids)}")
    print(f"Returned Claim ID: {claim_ids[0]} (Numeric ID: {numeric_ids[0]})\n")

    assert len(set(claim_ids)) == 1, f"Expected 1 unique claim ID, but got {set(claim_ids)}"

    # Check DB count after 10 clicks
    cursor.execute("SELECT COUNT(*) FROM claims")
    count_after_10_clicks = cursor.fetchone()[0]
    new_claims_created_1 = count_after_10_clicks - count_before
    print(f"Total Claims in DB after 10 rapid clicks: {count_after_10_clicks}")
    print(f"Claims created from 10 rapid clicks: {new_claims_created_1}")
    assert new_claims_created_1 == 1, f"Expected exactly 1 claim created, but got {new_claims_created_1}"

    # TEST 2: Normal submission of a DIFFERENT legitimate claim (Claim 2)
    print('\n--- TEST 2: Legitimate Second Claim: "Damaged road near school" ---')
    submission_key_2 = str(uuid.uuid4())
    payload_2 = {
        "title": "Damaged road near school",
        "description": "Severe potholes and broken asphalt near the primary school entrance pose hazard to pedestrian traffic.",
        "status": "pending",
        "idempotency_key": submission_key_2,
    }
    headers_2 = {"Idempotency-Key": submission_key_2}

    r_claim_2 = await client.post("/claims", json=payload_2, headers=headers_2)
    assert r_claim_2.status_code == 201
    claim_2_data = r_claim_2.json()
    claim_2_id = claim_2_data["claim_id"]
    claim_2_numeric = claim_2_data["id"]
    print(f"Second Claim Created Successfully -> ID: {claim_2_id} (Numeric: {claim_2_numeric})")

    # Check DB count after Claim 2
    cursor.execute("SELECT COUNT(*) FROM claims")
    count_after_both = cursor.fetchone()[0]
    total_new = count_after_both - count_before
    print(f"Total Claims in DB after both tests: {count_after_both}")
    print(f"Total new claims added across all tests: {total_new}")
    assert total_new == 2, f"Expected exactly 2 new claims in total, got {total_new}"

    # Inspect the exact 2 newly created records in SQLite
    cursor.execute(
        "SELECT id, title, description, idempotency_key FROM claims WHERE id IN (?, ?)",
        (numeric_ids[0], claim_2_numeric),
    )
    rows = cursor.fetchall()
    print("\n--- SQLite Verified Rows ---")
    for row in rows:
        print(f"Row {row[0]}: Title='{row[1]}', Key={row[3]}")

    conn.close()
    await client.aclose()
    print("\n>>> ALL DUPLICATE & IDEMPOTENCY TESTS PASSED! <<<")


if __name__ == "__main__":
    asyncio.run(run_duplicate_and_normal_tests())
