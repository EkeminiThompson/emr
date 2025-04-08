import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Typography, Paper, Box, Button, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tabs, Tab,
  Grid, Alert
} from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const API_BASE_URL = '/v1/billing/v1';
const DOCTORS_API_URL = '/v1/admin/doctors/';

const RevenueReportPage = () => {
  const [revenueData, setRevenueData] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeFrame, setTimeFrame] = useState('month');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [doctorId, setDoctorId] = useState('');

  // Fetch doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get(DOCTORS_API_URL);
        setDoctors(response.data);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setError("Failed to load doctors list");
      }
    };
    fetchDoctors();
  }, []);

  // Fetch initial revenue data
  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        time_frame: timeFrame === 'custom' ? null : timeFrame,
        start_date: timeFrame === 'custom' && startDate ? startDate.toISOString().split('T')[0] : null,
        end_date: timeFrame === 'custom' && endDate ? endDate.toISOString().split('T')[0] : null,
        doctor_id: doctorId || null
      };

      // Remove null parameters
      Object.keys(params).forEach(key => params[key] === null && delete params[key]);

      const response = await axios.get(`${API_BASE_URL}/billings/revenue-by-user`, { params });
      setRevenueData(response.data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setError("Failed to load revenue data");
      setRevenueData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeFrameChange = (event, newValue) => {
    setTimeFrame(newValue);
  };

  const handleDoctorChange = (event) => {
    setDoctorId(event.target.value);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Revenue Reports
      </Typography>

      <Paper sx={{ padding: 3, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={timeFrame} 
            onChange={handleTimeFrameChange}
            aria-label="time frame tabs"
          >
            <Tab label="Today" value="day" />
            <Tab label="This Week" value="week" />
            <Tab label="This Month" value="month" />
            <Tab label="This Year" value="year" />
            <Tab label="All Time" value="total" />
            <Tab label="Custom Range" value="custom" />
          </Tabs>
        </Box>

        {timeFrame === 'custom' && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                selected={startDate}
                onChange={date => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="Start Date"
                className="date-picker-input"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                selected={endDate}
                onChange={date => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                placeholderText="End Date"
                className="date-picker-input"
              />
            </Grid>
          </Grid>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Filter by Doctor</InputLabel>
              <Select
                value={doctorId}
                onChange={handleDoctorChange}
                label="Filter by Doctor"
              >
                <MenuItem value="">All Doctors</MenuItem>
                {doctors.map(doctor => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              variant="contained" 
              onClick={fetchRevenue}
              disabled={loading}
              sx={{ height: '56px' }}
              fullWidth
            >
              Generate Report
              {loading && <CircularProgress size={24} sx={{ ml: 1 }} />}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {revenueData.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Doctor</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Number of Billings</TableCell>
                  <TableCell align="right">Average per Billing</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {revenueData.map((row) => (
                  <TableRow key={row.doctor_id}>
                    <TableCell component="th" scope="row">
                      {row.doctor_name}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(row.total_revenue)}</TableCell>
                    <TableCell align="right">{row.billing_count}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(row.total_revenue / row.billing_count)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell><strong>Total</strong></TableCell>
                  <TableCell align="right">
                    <strong>
                      {formatCurrency(revenueData.reduce((sum, row) => sum + row.total_revenue, 0))}
                    </strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>
                      {revenueData.reduce((sum, row) => sum + row.billing_count, 0)}
                    </strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>
                      {formatCurrency(
                        revenueData.reduce((sum, row) => sum + row.total_revenue, 0) / 
                        Math.max(revenueData.reduce((sum, row) => sum + row.billing_count, 1), 1) // Fixed parenthesis
                      )}
                    </strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1" sx={{ textAlign: 'center', p: 3 }}>
            {loading ? 'Loading revenue data...' : 'No revenue data found for the selected criteria'}
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default RevenueReportPage;