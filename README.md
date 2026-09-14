# Victorian SA3 Socioeconomic & SDA Explorer

A static Leaflet web map for exploring 2021 Census socioeconomic indicators and Specialist Disability Accommodation (SDA) dwelling counts across Victorian SA3s.

## Included features

- Victorian SA3 choropleth map
- Indicator dropdown with socioeconomic, demographic and SDA measures
- SDA dwellings per 10,000 residents
- Five-class Jenks natural breaks for each indicator
- Consistent sequential colour scheme
- Hover display with SA3 name, selected value and Victorian rank
- Clickable SA3 profile panel with Census and SDA values
- Clean light basemap
- Reset map view button
- Static files suitable for GitHub Pages

## Run locally

You can open `index.html` directly in a browser. An internet connection is required for Leaflet, MapLibre and the OpenFreeMap basemap. No basemap API key or account is required.

Alternatively, from this folder run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

1. Create a new GitHub repository.
2. Upload the full contents of this folder, preserving the `data` folder.
3. In the repository go to **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose the `main` branch and `/ (root)`, then save.
6. GitHub will provide the public Pages URL after deployment.

## Data notes

- Map geography: ABS Statistical Area Level 3 (SA3), 2021.
- The map includes 66 standard Victorian SA3s represented in the supplied research dataset.
- ABS special categories `No usual address (Vic.)` and `Migratory - Offshore - Shipping (Vic.)` are excluded because they are not part of the supplied research table.
- `SDA dwellings per 10,000 residents` is calculated as:

  `SDA Dwelling Total / population_total × 10,000`

- Rank is descending by numeric value: rank 1 is the highest value in Victoria. Tied values share the same rank.
- Choropleth classes use five-class Jenks natural breaks calculated separately for each indicator.

## Files

- `index.html` — application page
- `style.css` — visual design
- `app.js` — map behaviour
- `data/sa3_data.js` — simplified Victorian SA3 geometry and attributes
- `data/metric_config.js` — labels, units and precomputed class breaks
- `data/victoria_sa3_metrics_with_sda_rate_and_ranks.csv` — joined table with calculated rate and ranks
