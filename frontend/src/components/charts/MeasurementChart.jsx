import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

export default function MeasurementChart({ measurements, series, selectedSeries, highlightedId, onPointClick }) {
  // Filter measurements by selected series
  const filteredMeasurements = measurements.filter(m => 
    selectedSeries.includes(m.series_id)
  );

  // Group by series
  const datasets = selectedSeries.map(seriesId => {
    const seriesObj = series.find(s => s.id === seriesId);
    const seriesMeasurements = filteredMeasurements
      .filter(m => m.series_id === seriesId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return {
      label: seriesObj?.name || `Series ${seriesId}`,
      data: seriesMeasurements.map(m => ({
        x: new Date(m.timestamp),
        y: m.value,
        id: m.id,
      })),
      borderColor: seriesObj?.color || '#999',
      backgroundColor: seriesMeasurements.map(m => 
        m.id === highlightedId ? '#ff0000' : (seriesObj?.color || '#999')
      ),
      pointRadius: seriesMeasurements.map(m => m.id === highlightedId ? 12 : 4),
      pointHoverRadius: 8,
      pointBorderWidth: seriesMeasurements.map(m => m.id === highlightedId ? 3 : 1),
      pointBorderColor: seriesMeasurements.map(m => 
        m.id === highlightedId ? '#000' : '#fff'
      ),
    };
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const datasetIndex = elements[0].datasetIndex;
        const index = elements[0].index;
        const pointData = datasets[datasetIndex].data[index];
        if (pointData && onPointClick) {
          onPointClick(pointData.id);
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Measurements Over Time',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const seriesObj = series.find(s => s.id === selectedSeries[context.datasetIndex]);
            return `${context.dataset.label}: ${context.parsed.y} ${seriesObj?.unit || ''}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          displayFormats: {
            hour: 'MMM d, HH:mm'
          }
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Value'
        }
      }
    }
  };

  if (datasets.length === 0 || datasets.every(ds => ds.data.length === 0)) {
    return (
      <div style={{ 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px'
      }}>
        <p style={{ color: '#666' }}>No data to display. Select series and date range.</p>
      </div>
    );
  }

  return (
    <div style={{ height: '400px' }}>
      <Line data={{ datasets }} options={options} />
    </div>
  );
}
