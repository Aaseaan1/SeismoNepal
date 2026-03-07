import requests
from bs4 import BeautifulSoup
from django.conf import settings

from .models import EarthquakeEvent


def scrape_earthquakes(limit: int = 20):
    response = requests.get(settings.SCRAPER_TARGET_URL, timeout=20)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'html.parser')
    rows = soup.select('table tbody tr')

    created = 0
    for row in rows[:limit]:
        cells = [cell.get_text(' ', strip=True) for cell in row.find_all('td')]
        if len(cells) < 4:
            continue

        occurred_at = cells[0]
        location = cells[-1]
        magnitude_text = next((value for value in cells if value.replace('.', '', 1).isdigit()), '')

        try:
            magnitude = float(magnitude_text)
        except ValueError:
            continue

        EarthquakeEvent.objects.create(
            source='EMSC',
            location=location,
            magnitude=magnitude,
            occurred_at=occurred_at,
        )
        created += 1

    return created
