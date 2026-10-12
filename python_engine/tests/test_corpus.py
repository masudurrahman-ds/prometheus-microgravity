from prometheus_engine.corpus import dashboard_summary, get_study, search_evidence


def fixture_corpus():
    return {
        "dataset_id": "test-corpus",
        "title": "Test corpus",
        "sources": [
            {"source_id": "MEASURED", "title": "Measured study", "url": "https://example.org/measured"},
            {"source_id": "CATALOGUE", "title": "Catalogue only", "metadata_only": True},
        ],
        "experiments": [
            {
                "exp_id": "EXP-1",
                "title": "Flame extinction test",
                "fuel": "fabric",
                "platform": "microgravity",
                "source_ids": ["MEASURED"],
                "observations": [
                    {
                        "phenomenon": "burn_duration",
                        "description": "Reported burn duration",
                        "measurement": {"value": "42", "unit": "s"},
                        "source_id": "MEASURED",
                        "locator": "Table 1",
                    }
                ],
                "conditions": {},
                "text": "flame extinction",
            },
            {
                "exp_id": "EXP-2",
                "title": "Flame investigation catalogue",
                "fuel": None,
                "platform": None,
                "source_ids": ["CATALOGUE"],
                "observations": [],
                "conditions": {},
                "text": "fire safety metadata",
            },
        ],
    }


def test_search_returns_source_and_scope_disclaimer():
    result = search_evidence("flame extinction", corpus=fixture_corpus())
    assert result["dataset_id"] == "test-corpus"
    assert result["results"][0]["experiment_id"] == "EXP-1"
    assert result["results"][0]["sources"][0]["source_id"] == "MEASURED"
    assert "currently indexed corpus only" in result["coverage_note"]


def test_catalogue_only_record_is_not_a_measurement():
    result = get_study("EXP-2", corpus=fixture_corpus())
    assert result["record_class"] == "metadata_only"
    assert result["evidence_state"] == "UNKNOWN"


def test_reported_measurement_is_not_mislabeled_as_raw_observed():
    result = get_study("EXP-1", corpus=fixture_corpus())
    assert result["record_class"] == "reported_measurements"
    assert result["evidence_state"] == "NASA_REPORTED"


def test_dashboard_counts_record_classes():
    result = dashboard_summary(corpus=fixture_corpus())
    assert result["indexed_experiment_count"] == 2
    assert result["record_classes"]["reported_measurements"] == 1
    assert result["record_classes"]["metadata_only"] == 1
