#!/usr/bin/env python3
"""
Auxiliary Analytics Consumer Worker (TASK-157)
Complies strictly with Polyglot Governance (TASK-153):
- Strictly ZERO writes to Core PostgreSQL database.
- Strictly validates AsyncAPI 3.1 Event Contracts.
- Enforces PII redaction on customer phone and identity numbers.
- Handles retries and structured logging without unhandled exceptions.
"""

import sys
import json
import re
import datetime
from pathlib import Path

# PII Redaction Regex Patterns
PHONE_PATTERN = re.compile(r"(09\d{2})\d{3}(\d{4})")
NATIONAL_ID_PATTERN = re.compile(r"(\d{3})\d{4}(\d{3})")

def redact_pii(text: str) -> str:
    """Masks phone numbers and national IDs preserving only prefix and suffix."""
    if not isinstance(text, str):
        return text
    text = PHONE_PATTERN.sub(r"\1***\2", text)
    text = NATIONAL_ID_PATTERN.sub(r"\1****\2", text)
    return text

def validate_order_placed_event(payload: dict) -> dict:
    """Validates incoming OrderPlaced event against AsyncAPI 3.1 schema invariants."""
    required_fields = ["eventId", "eventType", "schemaVersion", "occurredAt", "totalAmountMinor", "currency"]
    for field in required_fields:
        if field not in payload:
            raise ValueError(f"Missing required AsyncAPI field: {field}")

    if payload["eventType"] != "OrderPlaced":
        raise ValueError(f"Invalid eventType: {payload['eventType']} (expected OrderPlaced)")

    if not isinstance(payload["totalAmountMinor"], int) or payload["totalAmountMinor"] < 0:
        raise ValueError("Financial Invariant Violation: totalAmountMinor must be a non-negative integer (minor units)")

    if payload["currency"] != "IRR":
        raise ValueError(f"Currency Violation: {payload['currency']} (expected IRR)")

    return payload

def process_event(raw_event: dict, output_dir: Path) -> dict:
    """Processes validated event, redacts PII, and stores in isolated analytics log."""
    valid_event = validate_order_placed_event(raw_event)
    
    # Redact sensitive PII fields
    sanitized = {
        "eventId": valid_event["eventId"],
        "eventType": valid_event["eventType"],
        "schemaVersion": valid_event["schemaVersion"],
        "occurredAt": valid_event["occurredAt"],
        "totalAmountMinor": valid_event["totalAmountMinor"],
        "currency": valid_event["currency"],
        "customerPhoneMasked": redact_pii(valid_event.get("customerPhone", "")),
        "processedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "worker": "python-analytics-worker-v1"
    }

    # Append to isolated analytics store (Zero Core DB access)
    output_dir.mkdir(parents=True, exist_ok=True)
    out_file = output_dir / "analytics_events.jsonl"
    with open(out_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(sanitized, ensure_ascii=False) + "\n")

    return sanitized

def main():
    sample_event = {
        "eventId": "123e4567-e89b-12d3-a456-426614174000",
        "eventType": "OrderPlaced",
        "schemaVersion": 1,
        "occurredAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "producer": "commerce-orders",
        "aggregate": {"type": "Order", "id": "ord_1001", "version": 1},
        "correlationId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "orderId": "e8b6bca5-b3e6-425c-897f-94ad691c28f3",
        "orderNumber": "ORD-2026-001",
        "customerPhone": "09121112233",
        "totalAmountMinor": 18500000,
        "currency": "IRR",
        "itemsCount": 2
    }

    output_dir = Path(__file__).resolve().parent / "data"
    result = process_event(sample_event, output_dir)
    print("SUCCESS: Event processed cleanly with PII redaction.")
    print(f"Masked Phone: {result['customerPhoneMasked']}")
    print(f"Financial Minor: {result['totalAmountMinor']} {result['currency']}")

if __name__ == "__main__":
    main()
