import argparse
import os
import random
import sys
from datetime import datetime, timedelta

import django
from django.contrib.auth import get_user_model
from django.utils import timezone


def setup_django():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
    django.setup()


def random_datetime_in_year(year: int) -> datetime:
    start = datetime(year, 1, 1)
    end = datetime(year, 12, 31, 23, 59, 59)
    delta = end - start
    seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=seconds)


def pick_or_create_user():
    User = get_user_model()
    user = User.objects.first()
    if user:
        return user
    return User.objects.create_user(username="seed_user", password="seed_password")


def next_reference(prefix: str, existing_refs) -> str:
    max_num = 0
    for ref in existing_refs:
        if ref and ref.startswith(prefix):
            try:
                num = int(ref.split("-")[-1])
                max_num = max(max_num, num)
            except ValueError:
                continue
    return f"{prefix}{max_num + 1:04d}"


def ensure_ir_nc_settings(bu):
    from ir.models import (
        IncidentType,
        IncidentLocation,
        IncidentSeverity,
        IncidentProbability,
        IncidentRiskRating,
    )
    from nc.models import (
        NonConformanceOccurrence,
        NonConformanceSource,
        NonConformanceType,
        NonConformanceSeverity,
        NonConformanceProbability,
        NonConformanceRiskRating,
    )

    def create_missing(model, names, scores=None):
        existing = set(
            model.objects.filter(business_unit=bu).values_list("name", flat=True)
        )
        for idx, name in enumerate(names):
            if name in existing:
                continue
            payload = {"business_unit": bu, "name": name}
            if scores and idx < len(scores):
                payload["score"] = scores[idx]
            model.objects.create(**payload)

    create_missing(IncidentType, ["Safety", "Quality", "Environment", "Security", "Process"])
    create_missing(IncidentLocation, ["Site A", "Site B", "Office", "Warehouse"])
    create_missing(IncidentSeverity, ["Low", "Medium", "High", "Critical"], [1, 2, 3, 4])
    create_missing(IncidentProbability, ["Rare", "Occasional", "Likely", "Almost Certain"], [1, 2, 3, 4])
    create_missing(IncidentRiskRating, ["Minor", "Moderate", "Major", "Severe"], [1, 2, 3, 4])

    create_missing(NonConformanceOccurrence, ["Production", "Warehouse", "Office", "Supplier"])
    create_missing(NonConformanceSource, ["Internal", "Customer", "Audit", "Supplier"])
    create_missing(NonConformanceType, ["Process", "Product", "Documentation", "System"])
    create_missing(NonConformanceSeverity, ["Low", "Medium", "High", "Critical"], [1, 2, 3, 4])
    create_missing(NonConformanceProbability, ["Rare", "Occasional", "Likely", "Almost Certain"], [1, 2, 3, 4])
    create_missing(NonConformanceRiskRating, ["Minor", "Moderate", "Major", "Severe"], [1, 2, 3, 4])


def seed_incidents(bu, user, year: int, count: int):
    from ir.models import (
        Incident,
        IncidentType,
        IncidentLocation,
        IncidentSeverity,
        IncidentProbability,
        IncidentRiskRating,
    )

    types = list(IncidentType.objects.filter(business_unit=bu))
    locations = list(IncidentLocation.objects.filter(business_unit=bu))
    severities = list(IncidentSeverity.objects.filter(business_unit=bu))
    probabilities = list(IncidentProbability.objects.filter(business_unit=bu))
    risk_ratings = list(IncidentRiskRating.objects.filter(business_unit=bu))

    existing_refs = Incident.objects.filter(business_unit=bu).values_list(
        "reference", flat=True
    )

    for _ in range(count):
        incident_date = random_datetime_in_year(year)
        status = random.choice(
            ["Submitted", "Acknowledged", "Assigned", "In Progress", "Reviewed", "Closed"]
        )
        incident = Incident.objects.create(
            business_unit=bu,
            reported_by=user,
            incident_date=timezone.make_aware(incident_date),
            location="",
            description=f"Seed incident {random.randint(1000, 9999)}",
            severity="",
            status=status,
            incident_type=random.choice(types) if types else None,
            location_option=random.choice(locations) if locations else None,
            severity_option=random.choice(severities) if severities else None,
            probability_option=random.choice(probabilities) if probabilities else None,
            risk_rating_option=random.choice(risk_ratings) if risk_ratings else None,
        )

        prefix = f"IR-{bu.code}-{year}-"
        incident.reference = next_reference(prefix, existing_refs)
        incident.save(update_fields=["reference"])
        existing_refs = list(existing_refs) + [incident.reference]


def seed_nonconformances(bu, user, year: int, count: int):
    from nc.models import (
        NonConformance,
        NonConformanceOccurrence,
        NonConformanceSource,
        NonConformanceType,
        NonConformanceSeverity,
        NonConformanceProbability,
        NonConformanceRiskRating,
    )

    occurrences = list(NonConformanceOccurrence.objects.filter(business_unit=bu))
    sources = list(NonConformanceSource.objects.filter(business_unit=bu))
    types = list(NonConformanceType.objects.filter(business_unit=bu))
    severities = list(NonConformanceSeverity.objects.filter(business_unit=bu))
    probabilities = list(NonConformanceProbability.objects.filter(business_unit=bu))
    risk_ratings = list(NonConformanceRiskRating.objects.filter(business_unit=bu))

    existing_refs = NonConformance.objects.filter(business_unit=bu).values_list(
        "reference", flat=True
    )

    for _ in range(count):
        status = random.choice(
            ["Raised", "Logged", "Assigned", "RCA", "CAPA Implemented", "Verified", "Closed"]
        )
        nc = NonConformance.objects.create(
            business_unit=bu,
            raised_by=user,
            description=f"Seed non-conformance {random.randint(1000, 9999)}",
            classification=random.choice(["Minor", "Major", "Moderate", "Critical"]),
            status=status,
            occurrence_place=random.choice(occurrences) if occurrences else None,
            source=random.choice(sources) if sources else None,
            nc_type=random.choice(types) if types else None,
            severity_option=random.choice(severities) if severities else None,
            probability_option=random.choice(probabilities) if probabilities else None,
            risk_rating_option=random.choice(risk_ratings) if risk_ratings else None,
        )

        prefix = f"NC-{bu.code}-{year}-"
        nc.reference = next_reference(prefix, existing_refs)
        nc.save(update_fields=["reference"])
        existing_refs = list(existing_refs) + [nc.reference]

        target_date = timezone.make_aware(random_datetime_in_year(year))
        NonConformance.objects.filter(id=nc.id).update(date_raised=target_date)


def main():
    parser = argparse.ArgumentParser(description="Seed IR/NC dummy data.")
    parser.add_argument("--bu-id", type=int, default=None, help="BusinessUnit id")
    parser.add_argument("--count", type=int, default=100, help="Count per year")
    parser.add_argument("--years", nargs="+", type=int, default=[2025, 2026])
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    random.seed(args.seed)
    setup_django()

    from core.models import BusinessUnit

    bu = None
    if args.bu_id:
        bu = BusinessUnit.objects.filter(id=args.bu_id).first()
    if not bu:
        bu = BusinessUnit.objects.first()
    if not bu:
        bu = BusinessUnit.objects.create(name="Default BU", code="BU1")

    user = pick_or_create_user()

    ensure_ir_nc_settings(bu)

    for year in args.years:
        seed_incidents(bu, user, year, args.count)
        seed_nonconformances(bu, user, year, args.count)

    print(f"Seeded IR/NC for BU {bu.code} in years {args.years}.")


if __name__ == "__main__":
    main()
