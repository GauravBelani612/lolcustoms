import React from 'react';
import { AppBar, Tabs, Tab, Box, Typography, TextField, Checkbox, FormControlLabel, FormGroup, Button, Divider } from '@mui/material';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const lanes = ['Top', 'Jungle', 'Mid', 'Bot', 'Support'];

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function WeeklyForm({ onSubmitSuccess }) {
  const [riotId, setRiotId] = React.useState('');
  const [days, setDays] = React.useState([]);
  const [avoidLanes, setAvoidLanes] = React.useState([]);
  const [preferredOpponents, setPreferredOpponents] = React.useState('');
  const [status, setStatus] = React.useState(null);

  const handleDayChange = (day) => (event) => {
    setDays(event.target.checked
      ? [...days, day]
      : days.filter(d => d !== day)
    );
  };

  const handleLaneChange = (lane) => (event) => {
    setAvoidLanes(event.target.checked
      ? [...avoidLanes, lane]
      : avoidLanes.filter(l => l !== lane)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    try {
      const response = await fetch('http://localhost:8000/api/weekly-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riot_id: riotId,
          days,
          avoid_lanes: avoidLanes,
          preferred_opponents: preferredOpponents,
        }),
      });
      if (response.ok) {
        setStatus('success');
        setRiotId('');
        setDays([]);
        setAvoidLanes([]);
        setPreferredOpponents('');
        if (onSubmitSuccess) onSubmitSuccess();
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400 }}>
      <TextField
        label="Riot ID"
        value={riotId}
        onChange={e => setRiotId(e.target.value)}
        fullWidth
        margin="normal"
        required
      />
      <Divider sx={{ my: 2 }}>Days Available</Divider>
      <FormGroup>
        {daysOfWeek.map(day => (
          <FormControlLabel
            key={day}
            control={<Checkbox checked={days.includes(day)} onChange={handleDayChange(day)} />}
            label={day}
          />
        ))}
      </FormGroup>
      <Divider sx={{ my: 2 }}>Lanes You Don't Want to Play</Divider>
      <FormGroup row>
        {lanes.map(lane => (
          <FormControlLabel
            key={lane}
            control={<Checkbox checked={avoidLanes.includes(lane)} onChange={handleLaneChange(lane)} />}
            label={lane}
          />
        ))}
      </FormGroup>
      <Divider sx={{ my: 2 }}>Preferred Opponents</Divider>
      <TextField
        label="Anyone you really want to play against? (comma separated)"
        value={preferredOpponents}
        onChange={e => setPreferredOpponents(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        Submit
      </Button>
      {status === 'success' && (
        <Typography color="success.main" sx={{ mt: 2 }}>Form submitted successfully!</Typography>
      )}
      {status === 'error' && (
        <Typography color="error.main" sx={{ mt: 2 }}>Error submitting form. Please try again.</Typography>
      )}
    </Box>
  );
}

function Spreadsheet({ formSubmitted, onRefresh }) {
  const [submissions, setSubmissions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  // Fetch data on mount and every 5 seconds
  React.useEffect(() => {
    let isMounted = true;
    const fetchData = () => {
      setLoading(true);
      fetch('http://localhost:8000/api/weekly-form')
        .then(res => res.json())
        .then(data => {
          if (isMounted) {
            setSubmissions(data.submissions || []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setError(true);
            setLoading(false);
          }
        });
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Refresh immediately after form submission
  React.useEffect(() => {
    if (formSubmitted) {
      setLoading(true);
      fetch('http://localhost:8000/api/weekly-form')
        .then(res => res.json())
        .then(data => {
          setSubmissions(data.submissions || []);
          setLoading(false);
          if (onRefresh) onRefresh();
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    }
  }, [formSubmitted, onRefresh]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Weekly Form Responses</Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : error ? (
        <Typography color="error">Error loading data.</Typography>
      ) : (
        <Box sx={{ mt: 2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Riot ID</th>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Days Available</th>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Lanes to Avoid</th>
                <th style={{ border: '1px solid #ccc', padding: 8 }}>Preferred Opponents</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td style={{ border: '1px solid #ccc', padding: 8 }} colSpan={4} align="center">No data yet</td>
                </tr>
              ) : (
                submissions.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #ccc', padding: 8 }}>{row.riot_id}</td>
                    <td style={{ border: '1px solid #ccc', padding: 8 }}>{row.days.join(', ')}</td>
                    <td style={{ border: '1px solid #ccc', padding: 8 }}>{row.avoid_lanes.join(', ')}</td>
                    <td style={{ border: '1px solid #ccc', padding: 8 }}>{row.preferred_opponents}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Box>
      )}
    </Box>
  );
}

function TeamOrganizer() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Team Organizer</Typography>
      <Typography variant="body2" color="text.secondary">
        Select a day, then drag and drop players into teams. (Feature coming soon)
      </Typography>
      <Box sx={{ mt: 2, p: 2, border: '1px dashed #aaa', borderRadius: 2, minHeight: 120 }}>
        <Typography align="center" color="text.disabled">Drag-and-drop UI will appear here.</Typography>
      </Box>
    </Box>
  );
}

function Insights() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Insights</Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
        <Box sx={{ minWidth: 220, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
          <Typography variant="subtitle1">Player Winrates</Typography>
          <Typography color="text.secondary">(Stats will appear here)</Typography>
        </Box>
        <Box sx={{ minWidth: 220, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
          <Typography variant="subtitle1">Champion Winrates</Typography>
          <Typography color="text.secondary">(Stats will appear here)</Typography>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  const [tab, setTab] = React.useState(0);
  const [formSubmitted, setFormSubmitted] = React.useState(false);
  const handleChange = (event, newValue) => {
    setTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <AppBar position="static">
        <Tabs value={tab} onChange={handleChange} aria-label="main tabs">
          <Tab label="Weekly Form" />
          <Tab label="Spreadsheet" />
          <Tab label="Team Organizer" />
          <Tab label="Insights" />
        </Tabs>
      </AppBar>
      <TabPanel value={tab} index={0}><WeeklyForm onSubmitSuccess={() => setFormSubmitted(true)} /></TabPanel>
      <TabPanel value={tab} index={1}><Spreadsheet formSubmitted={formSubmitted} onRefresh={() => setFormSubmitted(false)} /></TabPanel>
      <TabPanel value={tab} index={2}><TeamOrganizer /></TabPanel>
      <TabPanel value={tab} index={3}><Insights /></TabPanel>
    </Box>
  );
}

export default App;
