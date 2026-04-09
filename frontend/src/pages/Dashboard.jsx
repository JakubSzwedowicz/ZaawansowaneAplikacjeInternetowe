import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import MeasurementChart from '../components/charts/MeasurementChart';
import MeasurementTable from '../components/tables/MeasurementTable';
import FilterPanel from '../components/ui/FilterPanel';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { data: newContent } = useQuery({
    queryKey: ['new-content'],
    queryFn: dataService.getNewContent,
    enabled: isAdmin,
  });
  const [series, setSeries] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [quality, setQuality] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    loadSeries();
  }, []);

  useEffect(() => {
    if (selectedSeries.length > 0) {
      loadMeasurements();
    }
  }, [selectedSeries, dateRange]);

  const loadSeries = async () => {
    try {
      setLoading(true);
      const seriesData = await dataService.getSeries();
      // Ensure seriesData is an array
      if (Array.isArray(seriesData)) {
        setSeries(seriesData);
        const seriesParam = searchParams.get('series');
        if (seriesParam) {
          const id = parseInt(seriesParam);
          setSelectedSeries(seriesData.some(s => s.id === id) ? [id] : seriesData.map(s => s.id));
        } else {
          setSelectedSeries(seriesData.map(s => s.id));
        }
      } else {
        console.error('Series data is not an array:', seriesData);
        setSeries([]);
        setSelectedSeries([]);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      setError('Failed to load series');
      console.error(err);
      setSeries([]);
      setSelectedSeries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMeasurements = async () => {
    try {
      const params = {
        series_ids: selectedSeries.join(','),
        start_date: dateRange.start ? `${dateRange.start}T00:00:00` : undefined,
        end_date: dateRange.end ? `${dateRange.end}T23:59:59` : undefined,
        limit: 500
      };
      const measurementsData = await dataService.getMeasurements(params);
      // Ensure measurementsData is an array
      if (Array.isArray(measurementsData)) {
        setMeasurements(measurementsData);
      } else {
        console.error('Measurements data is not an array:', measurementsData);
        setMeasurements([]);
        setError('Invalid measurements data received from server');
      }
    } catch (err) {
      setError('Failed to load measurements');
      console.error(err);
      setMeasurements([]);
    }
  };

  const handleRowClick = (id) => {
    setHighlightedId(id === highlightedId ? null : id);
  };

  const handlePointClick = (id) => {
    setHighlightedId(id === highlightedId ? null : id);
    // Scroll to the row in the table
    const element = document.querySelector(`tr[data-id="${id}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', color: '#c00' }}>{error}</div>;
  }

  const filteredMeasurements = measurements.filter(m =>
    selectedSeries.includes(m.series_id) &&
    (!quality || m.quality === quality)
  );

  return (
    <div className="dashboard-container" style={{ padding: '2rem' }}>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>IoT Measurement Dashboard</h1>
        <div className="no-print">
          <button 
            onClick={handlePrint}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#146c2e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}
          >
            🖨️ Print View
          </button>
          {isAdmin && (
            <button
              onClick={() => window.location.href = '/manage'}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem' }}
            >
              Manage Data
            </button>
          )}
        </div>
      </div>

      {isAdmin && !bannerDismissed && newContent?.since && (newContent.series_count > 0 || newContent.measurements_count > 0) && (
        <div role="alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', marginBottom: '1.5rem', backgroundColor: 'var(--primary)', color: '#fff', borderRadius: '4px', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>
            <strong>New since your last login:</strong>{' '}
            {newContent.series_count > 0 && `${newContent.series_count} series`}
            {newContent.series_count > 0 && newContent.measurements_count > 0 && ', '}
            {newContent.measurements_count > 0 && `${newContent.measurements_count} measurements`}
          </span>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/admin" style={{ color: '#fff', fontWeight: '600', textDecoration: 'underline' }}>
              Review in Admin panel →
            </Link>
            <button onClick={() => setBannerDismissed(true)} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>✕</button>
          </div>
        </div>
      )}

      <div className="no-print">
        <FilterPanel
          series={series}
          selectedSeries={selectedSeries}
          onSeriesChange={setSelectedSeries}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          quality={quality}
          onQualityChange={setQuality}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Chart</h2>
        <MeasurementChart
          measurements={filteredMeasurements}
          series={series}
          selectedSeries={selectedSeries}
          highlightedId={highlightedId}
          onPointClick={handlePointClick}
        />
      </div>

      <div>
        <h2>Measurements ({filteredMeasurements.length})</h2>
        <MeasurementTable
          measurements={filteredMeasurements}
          series={series}
          highlightedId={highlightedId}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
}
