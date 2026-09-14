(() => {
  'use strict';

  const data = window.SA3_DATA;
  const metricConfig = window.METRIC_CONFIG;

  if (!data || !metricConfig) {
    document.body.innerHTML = '<p style="padding:2rem;font-family:sans-serif">Map data could not be loaded.</p>';
    return;
  }

  const palette = ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'];
  const stateCount = data.features.length;
  const defaultMetric = 'SDA Dwelling Total';
  let activeMetric = defaultMetric;
  let selectedLayer = null;

  const selectEl = document.getElementById('indicatorSelect');
  const noteEl = document.getElementById('indicatorNote');
  const currentLabelEl = document.getElementById('currentIndicatorLabel');
  const legendEl = document.getElementById('legend');
  const detailPlaceholder = document.getElementById('detailPlaceholder');
  const detailContent = document.getElementById('detailContent');

  const map = L.map('map', {
    zoomControl: true,
    attributionControl: true,
    minZoom: 5,
    maxZoom: 12,
    preferCanvas: true
  });

  // OpenFreeMap vector basemap: no API key or registration required.
  // Loaded through the official MapLibre GL Leaflet binding.
  L.maplibreGL({
    style: 'https://tiles.openfreemap.org/styles/liberty'
  }).addTo(map);

  const rankField = key => `rank__${key}`;

  function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'No data';
    return Number(value).toLocaleString('en-AU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function formatMetricValue(key, value, includeUnit = true) {
    const cfg = metricConfig[key];
    if (!cfg) return formatNumber(value, 1);
    const formatted = formatNumber(value, cfg.decimals);
    if (!includeUnit || formatted === 'No data') return formatted;
    if (cfg.unit === '%') return `${formatted}%`;
    if (cfg.unit === 'years') return `${formatted} years`;
    if (cfg.unit === 'persons/km²') return `${formatted} persons/km²`;
    if (cfg.unit === 'dwellings') return `${formatted} dwellings`;
    if (cfg.unit === 'per 10,000 residents') return `${formatted} per 10,000`;
    return `${formatted} ${cfg.unit}`;
  }

  function classIndex(value, breaks) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return -1;
    const v = Number(value);
    for (let i = 1; i < breaks.length; i++) {
      if (v <= breaks[i]) return Math.min(i - 1, palette.length - 1);
    }
    return palette.length - 1;
  }

  function styleFeature(feature) {
    const cfg = metricConfig[activeMetric];
    const idx = classIndex(feature.properties[activeMetric], cfg.breaks);
    return {
      fillColor: idx >= 0 ? palette[idx] : '#d9dee5',
      weight: 0.8,
      opacity: 1,
      color: '#ffffff',
      fillOpacity: 0.82
    };
  }

  function tooltipHtml(props) {
    const cfg = metricConfig[activeMetric];
    const rank = props[rankField(activeMetric)];
    return `
      <div class="tooltip-name">${props.SA3_NAME_2021}</div>
      <div class="tooltip-metric">${cfg.label}: <strong>${formatMetricValue(activeMetric, props[activeMetric])}</strong></div>
      <div class="tooltip-rank">State rank: <strong>${rank} of ${stateCount}</strong></div>
    `;
  }

  function onEachFeature(feature, layer) {
    layer.bindTooltip(() => tooltipHtml(feature.properties), {
      sticky: true,
      direction: 'top',
      className: 'sa3-tooltip',
      opacity: 0.98
    });

    layer.on({
      mouseover: e => {
        e.target.setStyle({ weight: 2.1, color: '#294760', fillOpacity: 0.94 });
        e.target.bringToFront();
      },
      mouseout: e => {
        if (e.target !== selectedLayer) geoLayer.resetStyle(e.target);
        if (selectedLayer) selectedLayer.setStyle({ weight: 2.5, color: '#17324d', fillOpacity: 0.94 });
      },
      click: e => selectFeature(e.target, feature.properties)
    });
  }

  const geoLayer = L.geoJSON(data, {
    style: styleFeature,
    onEachFeature
  }).addTo(map);

  const initialBounds = geoLayer.getBounds();
  map.fitBounds(initialBounds, { padding: [18, 18] });

  function selectFeature(layer, props) {
    if (selectedLayer && selectedLayer !== layer) geoLayer.resetStyle(selectedLayer);
    selectedLayer = layer;
    selectedLayer.setStyle({ weight: 2.5, color: '#17324d', fillOpacity: 0.94 });
    selectedLayer.bringToFront();
    updateDetailPanel(props);
  }

  const rows = (items) => items.map(([label, value]) => `
    <div class="stat-row"><span>${label}</span><strong>${value}</strong></div>
  `).join('');

  function updateDetailPanel(p) {
    const cfg = metricConfig[activeMetric];
    const rank = p[rankField(activeMetric)];

    detailPlaceholder.classList.add('hidden');
    detailContent.classList.remove('hidden');
    detailContent.innerHTML = `
      <div class="sa3-heading">
        <h2>${p.SA3_NAME_2021}</h2>
        <div class="sa3-code">SA3 code ${p.SA3_CODE_2021}</div>
      </div>

      <div class="selected-metric">
        <div class="metric-label">${cfg.label}</div>
        <div class="metric-value">${formatMetricValue(activeMetric, p[activeMetric])}</div>
        <div class="metric-rank">State rank: ${rank} of ${stateCount} · 1 = highest</div>
      </div>

      <div class="detail-section">
        <h3>Population & context</h3>
        ${rows([
          ['Population', formatNumber(p.population_total, 0)],
          ['SA3 area', `${formatNumber(p.sa3_area_km2, 1)} km²`],
          ['Population density', `${formatNumber(p.population_density_persons_km2, 1)} persons/km²`],
          ['Median age', `${formatNumber(p.median_age_years, 0)} years`],
          ['Families', formatNumber(p.families_total_no, 0)],
          ['Families / occupied private dwellings', `${formatNumber(p.families_per_occupied_private_dwelling_pct, 1)}%`]
        ])}
      </div>

      <div class="detail-section">
        <h3>Socioeconomic profile</h3>
        ${rows([
          ['Employed labour force', `${formatNumber(p.employed_labour_force_pct, 1)}%`],
          ['Owner occupiers', `${formatNumber(p.owner_occupier_pct, 1)}%`],
          ['Owned outright', `${formatNumber(p.owner_outright_pct, 1)}%`],
          ['Mortgage / shared equity', `${formatNumber(p.owner_mortgage_shared_equity_pct, 1)}%`],
          ['Renters', `${formatNumber(p.renter_pct, 1)}%`],
          ['Language other than English at home', `${formatNumber(p.language_other_than_english_home_pct, 1)}%`],
          ['Core activity assistance', `${formatNumber(p.core_activity_assistance_pct, 1)}%`],
          ['Selected long-term health condition', `${formatNumber(p.long_term_health_condition_selected_pct, 1)}%`],
          ['ATSI language at home', `${formatNumber(p.atsi_language_home_pct, 2)}%`]
        ])}
      </div>

      <div class="detail-section">
        <h3>SDA profile</h3>
        ${rows([
          ['Existing', formatNumber(p['SDA Dwelling Existing'], 0)],
          ['Legacy', formatNumber(p['SDA Dwelling Legacy'], 0)],
          ['New Build', formatNumber(p['SDA Dwelling New Build'], 0)],
          ['New Build (Refurbishment)', formatNumber(p['SDA Dwelling New Build (Refurbishment)'], 0)],
          ['Total SDA dwellings', formatNumber(p['SDA Dwelling Total'], 0)],
          ['SDA dwellings / 10,000 residents', formatNumber(p.sda_dwellings_per_10000_residents, 1)]
        ])}
      </div>
    `;
  }

  function legendRangeLabel(lower, upper, i, decimals) {
    const fmt = n => formatNumber(n, decimals);
    if (i === 0) {
      if (Math.abs(upper - lower) < 1e-10) return fmt(upper);
      return `${fmt(lower)} – ${fmt(upper)}`;
    }
    return `>${fmt(lower)} – ${fmt(upper)}`;
  }

  function updateLegend() {
    const cfg = metricConfig[activeMetric];
    const b = cfg.breaks;
    const rowsHtml = palette.map((color, i) => {
      const lower = b[i];
      const upper = b[i + 1];
      return `
        <div class="legend-row">
          <span class="legend-swatch" style="background:${color}"></span>
          <span>${legendRangeLabel(lower, upper, i, cfg.decimals)}</span>
        </div>`;
    }).join('');

    const unitText = cfg.unit ? ` (${cfg.unit})` : '';
    legendEl.innerHTML = `
      <div class="legend-title">${cfg.label}${unitText}</div>
      <div class="legend-subtitle">5-class natural breaks</div>
      ${rowsHtml}
    `;
  }

  function updateIndicatorText() {
    const cfg = metricConfig[activeMetric];
    currentLabelEl.textContent = cfg.label;
    noteEl.textContent = `Values range from ${formatMetricValue(activeMetric, cfg.min)} to ${formatMetricValue(activeMetric, cfg.max)} across Victoria.`;
  }

  function refreshMetric() {
    geoLayer.setStyle(styleFeature);
    geoLayer.eachLayer(layer => {
      const feature = layer.feature;
      layer.setTooltipContent(tooltipHtml(feature.properties));
    });
    if (selectedLayer) {
      selectedLayer.setStyle({ weight: 2.5, color: '#17324d', fillOpacity: 0.94 });
      updateDetailPanel(selectedLayer.feature.properties);
    }
    updateLegend();
    updateIndicatorText();
  }

  selectEl.addEventListener('change', () => {
    activeMetric = selectEl.value;
    refreshMetric();
  });

  document.getElementById('resetView').addEventListener('click', () => {
    map.fitBounds(initialBounds, { padding: [18, 18] });
  });

  // Initial state.
  selectEl.value = defaultMetric;
  refreshMetric();
})();
