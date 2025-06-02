import React, { useState, useEffect } from 'react';
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
  Filler,
} from 'chart.js';
import type { ChartDataset } from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);
import './WeightPage.css';

interface WeightEntry {
  _id: string;
  date: string;
  weight: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}


const WeightPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [entryWeight, setEntryWeight] = useState<string>('');

  // State for editing goal weight
  const [isEditingGoalWeight, setIsEditingGoalWeight] = useState<boolean>(false);
  const [newGoalWeightInput, setNewGoalWeightInput] = useState<string>('');

  // Fetch weight history
  const fetchWeightHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [weightResponse, goalResponse] = await Promise.all([
        fetch('/api/weight', { 
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/weight/goal', { 
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!weightResponse.ok) throw new Error('Failed to fetch weight history');
      
      const weightEntries = await weightResponse.json();
      
      // Filtrar apenas entradas que têm peso (ignorar entradas que são apenas goal weight)
      const validWeightEntries = weightEntries.filter((entry: WeightEntry) => entry.weight !== null);
      
      // Sort entries by date in ascending order
      const sortedEntries = validWeightEntries.sort((a: WeightEntry, b: WeightEntry) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setWeightHistory(sortedEntries);

      // Atualizar o peso atual com a entrada mais recente, se houver
      if (sortedEntries.length > 0) {
        const mostRecentEntry = sortedEntries[sortedEntries.length - 1];
        setCurrentWeight(mostRecentEntry.weight);
      }

      // Atualizar o goal weight
      if (goalResponse.ok) {
        const goalData = await goalResponse.json();
        if (goalData) {
          setGoalWeight(goalData.goalWeight);
        }
      }
    } catch (err: any) {
      console.error('Error fetching weight data:', err);
      setError(err.message || 'Failed to fetch weight data');
    }
  };

  // Load user profile and weight history data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await fetchWeightHistory();
      } catch (err: any) {
        console.error('Error in fetchData:', err);
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle updating the goal weight
  const handleSaveGoalWeight = async () => {
    if (!newGoalWeightInput) {
      alert('Please enter a goal weight.');
      return;
    }

    const newGoalWeight = parseFloat(newGoalWeightInput);
    if (isNaN(newGoalWeight) || newGoalWeight <= 0) {
      alert('Please enter a valid goal weight.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required to update goal weight.');
      return;
    }

    try {
      console.log('Enviando requisição para atualizar peso meta...');
      const response = await fetch('/api/weight/goal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ weight: newGoalWeight })
      });

      console.log('Resposta recebida:', response);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta:', errorData);
        
        if (response.status === 401) {
          setError('Sessão expirada. Por favor, faça login novamente.');
        } else if (response.status === 400 && errorData.message) {
          setError(`Erro: ${errorData.message}`);
        } else {
          setError('Falha ao atualizar o peso meta. Por favor, tente novamente.');
        }
        return;
      }

      const updatedGoalWeight = await response.json();
      console.log('Peso meta atualizado com sucesso:', updatedGoalWeight);
      
      setGoalWeight(updatedGoalWeight.goalWeight);
      setIsEditingGoalWeight(false);
      setNewGoalWeightInput('');
      
      // Atualizar o histórico para incluir o novo goal weight
      await fetchWeightHistory();
      
      alert('Peso meta atualizado com sucesso!');

    } catch (err: any) {
      console.error('Erro ao atualizar o peso meta:', err);
      setError('Ocorreu um erro inesperado. Por favor, tente novamente.');
    }
  };

  const handleLogWeightSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!entryDate || !entryWeight) {
      alert('Please fill in date and weight.');
      return;
    }

    const newWeight = parseFloat(entryWeight);
    if (isNaN(newWeight) || newWeight <= 0) {
      alert('Please enter a valid weight.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required to save data.');
      return;
    }

    try {
      // Save new weight entry
      const response = await fetch('/api/weight', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          date: entryDate,
          weight: newWeight,
          notes: '' // Add notes field if needed
        })
      });

      if (!response.ok) {
        if (response.status === 401) setError('Session expired. Please log in again.');
        throw new Error('Failed to save weight entry');
      }
      
      const newEntry = await response.json();
      
      // Update local weight history and current weight
      setWeightHistory(prev => {
        // Format dates for comparison (YYYY-MM-DD)
        const newEntryDate = new Date(entryDate).toISOString().split('T')[0];
        
        // Remove any existing entry for this date
        const filtered = prev.filter(entry => {
          const entryDate = new Date(entry.date).toISOString().split('T')[0];
          return entryDate !== newEntryDate;
        });
        
        // Add the new entry and sort by date
        const updated = [...filtered, newEntry].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Update current weight to the most recent entry
        if (updated.length > 0) {
          const mostRecentEntry = updated[updated.length - 1];
          setCurrentWeight(mostRecentEntry.weight);
        }
        
        return updated as WeightEntry[];
      });
      
      // Reset form and hide
      setEntryDate(new Date().toISOString().split('T')[0]);
      setEntryWeight('');
      setShowForm(false);
      alert('Weight entry saved successfully!');

    } catch (err: any) {
      console.error('Error saving weight entry:', err);
      setError(err.message || 'Failed to save weight entry. Please try again.');
    }
  };

  const calculateProgress = () => {
    if (currentWeight === null || goalWeight === null || currentWeight === goalWeight || goalWeight <= 0) return 0;
    
    // Use the earliest weight in history as starting point if available, otherwise use current weight
    let initialWeightForCalc = currentWeight; // Fallback
    if (weightHistory.length > 0) {
      // Use the first recorded weight in history as the starting point
      initialWeightForCalc = weightHistory[0].weight; 
    }
    
    // If goal is to lose weight
    if (goalWeight < initialWeightForCalc) {
      const totalLossNeeded = initialWeightForCalc - goalWeight;
      if (totalLossNeeded <= 0) return currentWeight <= goalWeight ? 100 : 0;
      const lossAchieved = initialWeightForCalc - currentWeight;
      return Math.max(0, Math.min(100, (lossAchieved / totalLossNeeded) * 100));
    } 
    // If goal is to gain weight
    else if (goalWeight > initialWeightForCalc) {
      const totalGainNeeded = goalWeight - initialWeightForCalc;
      if (totalGainNeeded <= 0) return currentWeight >= goalWeight ? 100 : 0;
      const gainAchieved = currentWeight - initialWeightForCalc;
      return Math.max(0, Math.min(100, (gainAchieved / totalGainNeeded) * 100));
    } else { // initialWeightForCalc === goalWeight
      return currentWeight === goalWeight ? 100 : 0;
    }
  };

  // Early return for loading and error states
  if (loading) {
    return <div className="weight-page-container"><p className="loading-message">Loading weight data...</p></div>;
  }
  if (error) {
    return <div className="weight-page-container"><p className="error-message">Error: {error}</p></div>;
  }

  // Calculations and definitions for the chart (only if not loading/error)
  const progress = calculateProgress();

  // --- Chart Data Setup ---
  console.log('Preparing chart data. Goal Weight:', goalWeight, 'Weight History:', weightHistory);

  // Get all unique dates from weight history
  const allDates = [...new Set(weightHistory.map(entry => entry.date))].sort();
  
  // If no history, use today's date
  const chartLabels = allDates.length > 0 ? allDates : [new Date().toISOString().split('T')[0]];
  
  const chartDatasets: ChartDataset<'line', (number | null)[]>[] = [];

  // Add weight data if available
  if (weightHistory.length > 0) {
    const weightMap = weightHistory.reduce((acc: Record<string, number>, entry) => {
      acc[entry.date] = entry.weight;
      return acc;
    }, {});
    
    chartDatasets.push({
      label: 'Weight (kg)',
      data: chartLabels.map(date => weightMap[date] || null),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderWidth: 2,
      pointBackgroundColor: 'rgb(75, 192, 192)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgb(75, 192, 192)',
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.1,
      fill: false,
      order: 1
    });
  }

  // Add goal weight line if set
  if (goalWeight !== null && typeof goalWeight === 'number') {
    chartDatasets.push({
      label: 'Goal Weight (kg)',
      data: chartLabels.map(() => goalWeight as number),
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 2,
      borderDash: [5, 5],
      backgroundColor: 'transparent',
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0,
      order: 0
    });
  }
  // --- End Chart Data Setup ---

  const chartData = {
    labels: chartLabels,
    datasets: chartDatasets
  };

  let yAxisMin: number | undefined, yAxisMax: number | undefined;
  if (weightHistory.length > 0) {
    const allValues = weightHistory.map(entry => entry.weight);
    if (goalWeight !== null && typeof goalWeight === 'number') {
      allValues.push(goalWeight);
    }
    if (allValues.length > 0) {
      yAxisMin = Math.min(...allValues) - 2;
      yAxisMax = Math.max(...allValues) + 2;
    }
  } else if (goalWeight !== null && typeof goalWeight === 'number') {
    yAxisMin = goalWeight - 5;
    yAxisMax = goalWeight + 5;
  }
  
  if (yAxisMin === undefined) yAxisMin = currentWeight ? currentWeight - 10 : (goalWeight ? goalWeight - 5 : 50);
  if (yAxisMax === undefined) yAxisMax = currentWeight ? currentWeight + 10 : (goalWeight ? goalWeight + 5 : 100);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    // Ensure line charts show even with single data point
    elements: {
      line: {
        tension: 0.1
      },
      point: {
        radius: 4,
        hoverRadius: 6
      }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          tooltipFormat: 'MMM dd, yyyy',
          displayFormats: { day: 'MMM dd' }
        },
        title: { display: true, text: 'Date' },
      },
      y: {
        beginAtZero: false,
        suggestedMin: yAxisMin,
        suggestedMax: yAxisMax,
        title: { display: true, text: 'Weight (kg)' },
      },
    },
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Weight Trend' },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) label += context.parsed.y + ' kg';
            const entryIndex = context.dataIndex;
            if (context.datasetIndex === 0 && weightHistory[entryIndex]?.notes) {
              label += `\nNotes: ${weightHistory[entryIndex].notes}`;
            }
            return label;
          }
        }
      }
    },
  };

  // Show chart if there is history OR if a goal is set (to display the goal line)
  const chartDisplay = (weightHistory.length > 0 || (goalWeight !== null && typeof goalWeight === 'number')) ? (
    <Line data={chartData} options={chartOptions} />
  ) : (
    <div className="no-data-message" style={{ textAlign: 'center', padding: '2rem', border: '1px dashed #ccc', borderRadius: '8px' }}>
      <p>No weight data logged yet.</p>
      <p>Use the "Log New Weight Entry" button to add your first measurement!</p>
    </div>
  );

  return (
    <div className="weight-page-container">
      <h1 className="page-title">Weight Tracking</h1>

      <div className="chart-container" style={{ height: '400px', width: '90%', maxWidth: '800px', margin: '0 auto 2rem' }}>
        {chartDisplay}
      </div>

      <div className="weight-summary">
        {currentWeight !== null ? (
          <p>Current Weight: <strong>{currentWeight.toFixed(1)} kg</strong></p>
        ) : (
          <p><em>Log your first weight to see your current status.</em></p>
        )}

        {isEditingGoalWeight ? (
          <div className="goal-weight-edit">
            <input
              type="number"
              step="0.1"
              min="0"
              value={newGoalWeightInput}
              onChange={(e) => setNewGoalWeightInput(e.target.value)}
              placeholder="Enter goal weight (kg)"
            />
            <button onClick={handleSaveGoalWeight}>Save</button>
            <button onClick={() => setIsEditingGoalWeight(false)}>Cancel</button>
          </div>
        ) : (
          goalWeight !== null ? (
            <div className="goal-weight-display">
              <p>Goal Weight: <strong>{goalWeight.toFixed(1)} kg</strong></p>
              <button onClick={() => { 
                setIsEditingGoalWeight(true); 
                setNewGoalWeightInput(goalWeight.toString()); 
              }} className="btn-edit-goal">
                Edit Goal
              </button>
            </div>
          ) : (
            <div className="goal-weight-display">
              <p><em>Set your goal weight to track progress.</em></p>
              <button onClick={() => {
                setNewGoalWeightInput('');
                setIsEditingGoalWeight(true);
              }}>
                Set Goal Weight
              </button>
            </div>
          )
        )}

        {currentWeight !== null && goalWeight !== null && goalWeight > 0 && !isEditingGoalWeight && (
          <>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}>
                {progress.toFixed(0)}%
              </div>
            </div>
            {currentWeight <= goalWeight ? (
              <p className="goal-message">You've reached your goal! 🎉</p>
            ) : (
              <p className="goal-message">Keep going! You're <strong>{(currentWeight - goalWeight).toFixed(1)} kg</strong> away from your goal.</p>
            )}
          </>
        )}
      </div>

      <button onClick={() => setShowForm(!showForm)} className="btn-log-weight">
        {showForm ? 'Cancel' : 'Log New Weight Entry'}
      </button>

      {showForm && (
        <form onSubmit={handleLogWeightSubmit} className="weight-form">
          <div className="form-group">
            <label htmlFor="entryDate">Date:</label>
            <input
              type="date"
              id="entryDate"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="entryWeight">Weight (kg):</label>
            <input
              type="number"
              id="entryWeight"
              step="0.1"
              min="0"
              value={entryWeight}
              onChange={(e) => setEntryWeight(e.target.value)}
              placeholder="Enter your weight"
              required
            />
          </div>
          <button type="submit">Save Weight</button>
        </form>
      )}

      {weightHistory.length > 0 && (
        <div className="weight-history">
          <h2>Weight History</h2>
          <div className="history-list">
            {weightHistory
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((entry, index) => (
                <div key={`${entry.date}-${index}`} className="history-entry">
                  <div className="history-date">
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                  <div className="history-weight">
                    {entry.weight} kg
                  </div>
                  {entry.notes && <div className="history-notes">{entry.notes}</div>}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeightPage;
