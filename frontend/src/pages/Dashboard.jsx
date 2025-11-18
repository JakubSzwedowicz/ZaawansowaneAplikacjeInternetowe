import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { dataService } from '../services/dataService';
import MeasurementChart from '../components/charts/MeasurementChart';
import MeasurementTable from '../components/tables/MeasurementTable';
import FilterPanel from '../components/ui/FilterPanel';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [series, setSeries] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
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
        // Auto-select all series initially
        setSelectedSeries(seriesData.map(s => s.id));
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
    selectedSeries.includes(m.series_id)
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
              backgroundColor: '#28a745',
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
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ⚙️ Manage Data
            </button>
          )}
        </div>
      </div>

      <div className="no-print">
        <FilterPanel
          series={series}
          selectedSeries={selectedSeries}
          onSeriesChange={setSelectedSeries}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
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
