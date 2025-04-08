import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TextField,
  Button,
  Container,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';

function PatientSearch({ searchData, handleSearchChange, searchPatients, patients = [], error, handlePatientSelect, loading }) {
  return (
    <Paper sx={{ padding: 3 }}>
      <Typography variant="h5">Search Patients</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Patient ID"
            name="patient_id"
            value={searchData.patient_id}
            onChange={handleSearchChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Surname"
            name="surname"
            value={searchData.surname}
            onChange={handleSearchChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Other Names"
            name="other_names"
            value={searchData.other_names}
            onChange={handleSearchChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Hospital Registration Number"
            name="hospital_reg_number"
            value={searchData.hospital_reg_number}
            onChange={handleSearchChange}
          />
        </Grid>
      </Grid>
      <Button variant="contained" color="primary" onClick={searchPatients} sx={{ marginTop: 2 }} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Search'}
      </Button>

      {patients.length > 0 && (
        <Paper sx={{ marginTop: 3, padding: 2 }}>
          <Typography variant="h5">Search Results</Typography>
          <List>
            {patients.map((patient) => (
              <ListItem key={patient.patient_id}>
                <ListItemText
                  primary={`${patient.surname}, ${patient.other_names} (ID: ${patient.patient_id})`}
                />
                <Button variant="outlined" onClick={() => handlePatientSelect(patient)}>
                  View Pharmacy Records
                </Button>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      {error && <Typography color="error" sx={{ marginTop: 2 }}>{error}</Typography>}
    </Paper>
  );
}

function PharmacyHistory({ pharmacyRecords, handleDeleteRecord, handleEditRecord, handleMarkAsPaid, handleDownloadReceipt }) {
  return (
    <Paper sx={{ marginTop: 3, padding: 2 }}>
      <Typography variant="h5">Pharmacy Records</Typography>
      <List>
        {pharmacyRecords.map((record) => (
          <ListItem key={record.pharmacy_id}>
            <ListItemText
              primary={`Medication: ${record.medication_name}, Dosage: ${record.dosage_and_route}`}
              secondary={`Frequency: ${record.frequency}, Total Cost: ₦${record.total_cost}, Status: ${record.is_paid ? 'Paid' : 'Unpaid'}`}
            />
            <Button variant="outlined" sx={{ marginRight: 1 }} onClick={() => handleEditRecord(record)}>
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleDeleteRecord(record.pharmacy_id)}
            >
              Delete
            </Button>
            {!record.is_paid && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => handleMarkAsPaid(record.pharmacy_id)}
                sx={{ marginLeft: 1 }}
              >
                Mark as Paid
              </Button>
            )}
            {record.is_paid && (
              <Button
                variant="outlined"
                color="success"
                onClick={() => handleDownloadReceipt(record)}
                sx={{ marginLeft: 1 }}
              >
                Download Receipt
              </Button>
            )}
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

function AddPharmacyRecord({ pharmacyData, setPharmacyData, addPharmacyRecord, drugs, loading }) {
  const calculateTotalCost = () => {
    return pharmacyData.drug_orders.reduce((total, drug) => total + (drug.price || 0) * (drug.quantity || 0), 0);
  };

  const handleAddDrug = () => {
    const newDrug = { drug_id: '', quantity: 1, price: 0.0 };
    setPharmacyData((prev) => ({
      ...prev,
      drug_orders: [...prev.drug_orders, newDrug],
    }));
  };

  const handleDrugChange = (index, e) => {
    const { name, value } = e.target;
    const updatedDrugs = pharmacyData.drug_orders.map((drug, i) =>
      i === index ? { ...drug, [name]: value } : drug
    );
    setPharmacyData({ ...pharmacyData, drug_orders: updatedDrugs });
  };

  const handleSubmit = () => {
    const total_cost = calculateTotalCost();
    const pharmacyRecord = {
      patient_id: pharmacyData.patient_id,
      medication_name: pharmacyData.medication_name,
      dosage_and_route: pharmacyData.dosage_and_route,
      frequency: pharmacyData.frequency,
      dispensation_date: pharmacyData.dispensation_date,
      drug_orders: pharmacyData.drug_orders.map((drug) => ({
        drug_id: parseInt(drug.drug_id, 10),
        quantity: parseInt(drug.quantity, 10),
        price: drug.price ? parseFloat(drug.price) : null,
      })),
    };

    addPharmacyRecord(pharmacyRecord);
  };

  return (
    <Paper sx={{ marginTop: 3, padding: 2 }}>
      <Typography variant="h5">Add Pharmacy Record</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Patient ID"
            name="patient_id"
            value={pharmacyData.patient_id}
            onChange={(e) => setPharmacyData({ ...pharmacyData, patient_id: e.target.value })}
            disabled
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Medication Name"
            name="medication_name"
            value={pharmacyData.medication_name}
            onChange={(e) => setPharmacyData({ ...pharmacyData, medication_name: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Dosage and Route"
            name="dosage_and_route"
            value={pharmacyData.dosage_and_route}
            onChange={(e) => setPharmacyData({ ...pharmacyData, dosage_and_route: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Frequency"
            name="frequency"
            value={pharmacyData.frequency}
            onChange={(e) => setPharmacyData({ ...pharmacyData, frequency: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Dispensation Date"
            name="dispensation_date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={pharmacyData.dispensation_date}
            onChange={(e) => setPharmacyData({ ...pharmacyData, dispensation_date: e.target.value })}
            required
          />
        </Grid>
      </Grid>
      <Typography variant="h6" sx={{ marginTop: 2 }}>Drug Orders</Typography>
      {pharmacyData.drug_orders.map((drug, index) => (
        <Grid container spacing={2} key={index}>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Drug</InputLabel>
              <Select
                name="drug_id"
                value={drug.drug_id || ''}
                onChange={(e) => handleDrugChange(index, e)}
                label="Drug"
                required
              >
                {drugs.map((drugOption) => (
                  <MenuItem key={drugOption.id} value={drugOption.id}>
                    {drugOption.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Quantity"
              name="quantity"
              type="number"
              value={drug.quantity}
              onChange={(e) => handleDrugChange(index, e)}
              required
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Price"
              name="price"
              type="number"
              value={drug.price || ''}
              onChange={(e) => handleDrugChange(index, e)}
            />
          </Grid>
        </Grid>
      ))}
      <Button variant="outlined" onClick={handleAddDrug} sx={{ marginTop: 2 }}>
        Add Drug
      </Button>
      <Typography variant="h6" sx={{ marginTop: 2 }}>
        Total Cost: ₦{calculateTotalCost().toFixed(2)}
      </Typography>
      <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ marginTop: 2 }} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Save Record'}
      </Button>
    </Paper>
  );
}

function EditPharmacyDialog({ open, onClose, pharmacyRecord, setPharmacyRecord, handleUpdateRecord, drugs, loading }) {
  const calculateTotalCost = () => {
    return pharmacyRecord.drug_orders.reduce((total, drug) => total + (drug.price || 0) * (drug.quantity || 0), 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPharmacyRecord({ ...pharmacyRecord, [name]: value });
  };

  const handleDrugChange = (index, e) => {
    const { name, value } = e.target;
    const updatedDrugs = pharmacyRecord.drug_orders.map((drug, i) =>
      i === index ? { ...drug, [name]: value } : drug
    );
    setPharmacyRecord({ ...pharmacyRecord, drug_orders: updatedDrugs });
  };

  const handleAddDrug = () => {
    const newDrug = { drug_id: '', quantity: 1, price: 0.0 };
    setPharmacyRecord((prev) => ({
      ...prev,
      drug_orders: [...prev.drug_orders, newDrug],
    }));
  };

  const handleRemoveDrug = (index) => {
    const updatedDrugs = pharmacyRecord.drug_orders.filter((_, i) => i !== index);
    setPharmacyRecord({ ...pharmacyRecord, drug_orders: updatedDrugs });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Pharmacy Record</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Medication Name"
              name="medication_name"
              value={pharmacyRecord.medication_name || ''}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dosage and Route"
              name="dosage_and_route"
              value={pharmacyRecord.dosage_and_route || ''}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Frequency"
              name="frequency"
              value={pharmacyRecord.frequency || ''}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dispensation Date"
              name="dispensation_date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={pharmacyRecord.dispensation_date || ''}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ marginTop: 2 }}>Drug Orders</Typography>
            {pharmacyRecord.drug_orders.map((drug, index) => (
              <Grid container spacing={2} key={index}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Drug</InputLabel>
                    <Select
                      name="drug_id"
                      value={drug.drug_id || ''}
                      onChange={(e) => handleDrugChange(index, e)}
                      label="Drug"
                      required
                    >
                      {drugs.map((drugOption) => (
                        <MenuItem key={drugOption.id} value={drugOption.id}>
                          {drugOption.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    name="quantity"
                    type="number"
                    value={drug.quantity}
                    onChange={(e) => handleDrugChange(index, e)}
                    required
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Price"
                    name="price"
                    type="number"
                    value={drug.price || ''}
                    onChange={(e) => handleDrugChange(index, e)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleRemoveDrug(index)}
                    sx={{ marginTop: 1 }}
                  >
                    Remove Drug
                  </Button>
                </Grid>
              </Grid>
            ))}
            <Button variant="outlined" onClick={handleAddDrug} sx={{ marginTop: 2 }}>
              Add Drug
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ marginTop: 2 }}>
              Total Cost: ₦{calculateTotalCost().toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleUpdateRecord} color="primary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PharmacyDashboard() {
  const [searchData, setSearchData] = useState({
    patient_id: '',
    surname: '',
    other_names: '',
    hospital_reg_number: ''
  });

  const [pharmacyData, setPharmacyData] = useState({
    patient_id: '',
    medication_name: '',
    dosage_and_route: '',
    frequency: '',
    dispensation_date: new Date().toISOString().split('T')[0],
    drug_orders: [],
  });

  const [patients, setPatients] = useState([]);
  const [pharmacyRecords, setPharmacyRecords] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pharmacyRecord, setPharmacyRecord] = useState(null);
  const [drugs, setDrugs] = useState([]);

  // Fetch drugs from the API
  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const response = await axios.get('/v1/pharmacy/drugs');
        setDrugs(response.data);
      } catch (err) {
        setError("Error fetching drugs.");
      }
    };
    fetchDrugs();
  }, []);

  const searchPatients = async () => {
    const { patient_id, surname, other_names, hospital_reg_number } = searchData;
    setLoading(true);
    try {
      const response = await axios.get('/v1/pharmacy/patients', {
        params: { patient_id, surname, other_names, hospital_reg_number },
      });
      setPatients(response.data.patients);
      setError(null);
    } catch (err) {
      setError("No patients found.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    setPharmacyData({ ...pharmacyData, patient_id: patient.patient_id });
    try {
      const response = await axios.get(`/v1/pharmacy/patients/${patient.patient_id}/pharmacy`);
      setPharmacyRecords(response.data);
      setError(null);
    } catch (err) {
      setError("Error fetching pharmacy records for this patient.");
    }
  };

  const addPharmacyRecord = async (record) => {
    setLoading(true);
    try {
      const response = await axios.post(`/v1/pharmacy/patients/${record.patient_id}/pharmacy`, record);
      setPharmacyRecords([...pharmacyRecords, response.data]);
      setMessage("Pharmacy record created successfully.");
    } catch (err) {
      setError("Error creating pharmacy record.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (record_id) => {
    setLoading(true);
    try {
      await axios.delete(`/v1/pharmacy/patients/${selectedPatient.patient_id}/pharmacy/${record_id}`);
      setPharmacyRecords(pharmacyRecords.filter((record) => record.pharmacy_id !== record_id));
      setMessage("Pharmacy record deleted successfully.");
    } catch (err) {
      setError("Error deleting pharmacy record.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecord = (record) => {
    setPharmacyRecord(record);
    setEditDialogOpen(true);
  };

  const handleUpdateRecord = async () => {
    setLoading(true);
    try {
      const response = await axios.put(
        `/v1/pharmacy/patients/${pharmacyRecord.patient_id}/pharmacy/${pharmacyRecord.pharmacy_id}`,
        pharmacyRecord
      );
      const updatedRecords = pharmacyRecords.map((item) =>
        item.pharmacy_id === pharmacyRecord.pharmacy_id ? response.data : item
      );
      setPharmacyRecords(updatedRecords);
      setMessage("Pharmacy record updated successfully.");
      setEditDialogOpen(false);
    } catch (err) {
      setError("Error updating pharmacy record.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (record_id) => {
    setLoading(true);
    try {
      const response = await axios.patch(
        `/v1/pharmacy/patients/${selectedPatient.patient_id}/pharmacy/${record_id}/mark-as-paid`
      );
      const updatedRecords = pharmacyRecords.map((record) =>
        record.pharmacy_id === record_id ? { ...record, is_paid: true } : record
      );
      setPharmacyRecords(updatedRecords);
      setMessage("Pharmacy record marked as paid successfully.");
    } catch (err) {
      setError("Error marking pharmacy record as paid.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (record) => {
    try {
      const response = await axios.get(
        `/v1/pharmacy/patients/${selectedPatient.patient_id}/pharmacy/${record.pharmacy_id}/download-receipt`,
        { responseType: "blob" }
      );

      // Create a Blob from the response PDF
      const blob = new Blob([response.data], { type: "application/pdf" });

      // Create a download link
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Receipt_${record.pharmacy_id}.pdf`;
      link.click();

      // Cleanup
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Error downloading receipt:", err);
      setError("Error generating receipt.");
    }
  };

  return (
    <Container>
      <PatientSearch
        searchData={searchData}
        handleSearchChange={handleSearchChange}
        searchPatients={searchPatients}
        patients={patients}
        error={error}
        handlePatientSelect={handlePatientSelect}
        loading={loading}
      />
      {selectedPatient && (
        <div>
          <PharmacyHistory
            pharmacyRecords={pharmacyRecords}
            handleDeleteRecord={handleDeleteRecord}
            handleEditRecord={handleEditRecord}
            handleMarkAsPaid={handleMarkAsPaid}
            handleDownloadReceipt={handleDownloadReceipt}
          />
          <AddPharmacyRecord
            pharmacyData={pharmacyData}
            setPharmacyData={setPharmacyData}
            addPharmacyRecord={addPharmacyRecord}
            drugs={drugs}
            loading={loading}
          />
        </div>
      )}
      <Snackbar
        open={message !== ''}
        autoHideDuration={6000}
        onClose={() => setMessage('')}
      >
        <Alert severity="success">{message}</Alert>
      </Snackbar>
      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
      {pharmacyRecord && (
        <EditPharmacyDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          pharmacyRecord={pharmacyRecord}
          setPharmacyRecord={setPharmacyRecord}
          handleUpdateRecord={handleUpdateRecord}
          drugs={drugs}
          loading={loading}
        />
      )}
    </Container>
  );
}

export default PharmacyDashboard;






from fastapi import APIRouter, HTTPException, Depends, Query, status, Response
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from decimal import Decimal
import json
import logging
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO
import requests
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image

from app.models import PharmacyRecord, Drug, Patient, Billing, Stock
from app.database import get_db
from app.schemas import (
    PharmacyRecordCreate, PharmacyRecordUpdate, PharmacyOut, 
    DrugOut, PatientSearchResponse, BillingOut, DrugOrder, ReceiptTemplate
)

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Dependency to get patient by ID
def get_patient(patient_id: str, db: Session):
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        logger.error(f"Patient with ID {patient_id} not found")
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found")
    return patient

# Dependency to get pharmacy record by ID
def get_pharmacy_record(record_id: int, patient_id: str, db: Session):
    record = db.query(PharmacyRecord).filter(
        PharmacyRecord.pharmacy_id == record_id,
        PharmacyRecord.patient_id == patient_id
    ).first()
    if not record:
        logger.error(f"Pharmacy record {record_id} not found for patient {patient_id}")
        raise HTTPException(status_code=404, detail=f"Pharmacy record {record_id} not found for patient {patient_id}")
    return record

# Dependency to get drug by ID
def get_drug(drug_id: int, db: Session):
    drug = db.query(Drug).filter(Drug.id == drug_id).first()
    if not drug:
        logger.error(f"Drug with ID {drug_id} not found")
        raise HTTPException(status_code=404, detail=f"Drug with ID {drug_id} not found")
    return drug

# Dependency to get stock by drug ID
def get_stock(drug_id: int, db: Session):
    stock = db.query(Stock).filter(Stock.drug_id == drug_id).first()
    if not stock:
        logger.error(f"Stock for drug ID {drug_id} not found")
        raise HTTPException(status_code=404, detail=f"Stock for drug ID {drug_id} not found")
    return stock

# Dependency to get billing by ID
def get_billing(billing_id: int, db: Session):
    billing = db.query(Billing).filter(Billing.billing_id == billing_id).first()
    if not billing:
        logger.error(f"Billing record {billing_id} not found")
        raise HTTPException(status_code=404, detail=f"Billing record {billing_id} not found")
    return billing

# 1. Search Patients
@router.get("/patients", response_model=PatientSearchResponse)
def search_patients(
    patient_id: Optional[str] = None,
    surname: Optional[str] = None,
    other_names: Optional[str] = None,
    hospital_reg_number: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    sort_by: Optional[str] = 'surname',
    db: Session = Depends(get_db)
):
    query = db.query(Patient)

    if patient_id:
        query = query.filter(Patient.patient_id.ilike(f"%{patient_id}%"))
    if surname:
        query = query.filter(Patient.surname.ilike(f"%{surname}%"))
    if other_names:
        query = query.filter(Patient.other_names.ilike(f"%{other_names}%"))
    if hospital_reg_number:
        query = query.filter(Patient.hospital_reg_number.ilike(f"%{hospital_reg_number}%"))

    if sort_by == "surname":
        query = query.order_by(Patient.surname)
    elif sort_by == "hospital_reg_number":
        query = query.order_by(Patient.hospital_reg_number)

    total = query.order_by(None).count()
    patients = query.offset((page - 1) * size).limit(size).all()

    if not patients:
        logger.warning("No patients found for the given search criteria")
        raise HTTPException(status_code=404, detail="No patients found")

    return {"total_records": total, "page": page, "size": size, "patients": patients}

# 2. Create Pharmacy Record
@router.post("/patients/{patient_id}/pharmacy", response_model=PharmacyOut)
def create_pharmacy_record(
    patient_id: str,
    pharmacy: PharmacyRecordCreate,
    db: Session = Depends(get_db)
):
    # Retrieve patient
    patient = get_patient(patient_id, db)

    # Retrieve or create billing record
    billing = db.query(Billing).filter(Billing.patient_id == patient_id).first()
    if not billing:
        billing = Billing(patient_id=patient_id, amount=Decimal("0.00"))
        db.add(billing)
        db.commit()
        db.refresh(billing)

    # Process drug orders
    drug_orders_list = []
    total_price = Decimal("0.00")

    for drug_order in pharmacy.drug_orders:
        drug = get_drug(drug_order.drug_id, db)
        stock = get_stock(drug_order.drug_id, db)

        # Check if sufficient stock is available
        if stock.quantity < drug_order.quantity:
            logger.error(f"Insufficient stock for drug {drug.name}. Available: {stock.quantity}, Requested: {drug_order.quantity}")
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for drug {drug.name}. Available: {stock.quantity}, Requested: {drug_order.quantity}"
            )

        # Use provided price or fetch from Drug model
        price = drug_order.price if drug_order.price is not None else drug.price

        # Calculate total price for this drug order
        total_price += round(Decimal(str(price)) * Decimal(str(drug_order.quantity)), 2)

        # Reduce stock quantity
        stock.quantity -= drug_order.quantity
        db.commit()

        # Add drug order to the list
        drug_orders_list.append({
            "drug_id": drug_order.drug_id,
            "drug_name": drug.name,  # Include drug name
            "quantity": drug_order.quantity,
            "price": float(price)  # Convert to float for JSON serialization
        })

    # Create new pharmacy record
    new_record = PharmacyRecord(
        patient_id=patient_id,
        medication_name=pharmacy.medication_name,
        dosage_and_route=pharmacy.dosage_and_route,
        frequency=pharmacy.frequency,
        dispensation_date=pharmacy.dispensation_date,
        billing_id=billing.billing_id,
        drug_orders=drug_orders_list,  # List of drug orders with prices
    )

    try:
        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        # Update billing
        billing.amount = (billing.amount or Decimal("0.00")) + total_price
        db.commit()

        return new_record

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error while creating pharmacy record: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while processing the request.")


# 3. Get Pharmacy History for Patient
@router.get("/patients/{patient_id}/pharmacy", response_model=List[PharmacyOut])
def get_pharmacy_history_for_patient(
    patient_id: str,
    db: Session = Depends(get_db)
):
    patient = get_patient(patient_id, db)
    records = db.query(PharmacyRecord).filter(PharmacyRecord.patient_id == patient_id).all()

    for record in records:
        if record.drug_orders is None:
            record.drug_orders = []  # Ensure drug_orders is always a list
        
        # Convert dispensation_date to date if it's a datetime
        if isinstance(record.dispensation_date, datetime):
            record.dispensation_date = record.dispensation_date.date()

    return records if records else []

# 4. Update Pharmacy Record
@router.put("/patients/{patient_id}/pharmacy/{record_id}", response_model=PharmacyOut)
def update_pharmacy_record(
    patient_id: str,
    record_id: int,
    pharmacy: PharmacyRecordUpdate,
    db: Session = Depends(get_db)
):
    patient = get_patient(patient_id, db)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found")

    record = get_pharmacy_record(record_id, patient_id, db)
    if not record:
        raise HTTPException(status_code=404, detail=f"Pharmacy record with ID {record_id} not found for this patient.")

    # Update pharmacy record fields
    for key, value in pharmacy.dict(exclude_unset=True).items():
        setattr(record, key, value)

    try:
        db.commit()
        db.refresh(record)
        return record
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while updating the pharmacy record.")

# 5. Delete Pharmacy Record
@router.delete("/patients/{patient_id}/pharmacy/{record_id}", status_code=204)
def delete_pharmacy_record(
    patient_id: str,
    record_id: int,
    db: Session = Depends(get_db)
):
    patient = get_patient(patient_id, db)
    record = get_pharmacy_record(record_id, patient_id, db)

    try:
        db.delete(record)
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# 6. Get All Drugs
@router.get("/drugs", response_model=List[DrugOut])
def get_all_drugs(db: Session = Depends(get_db)):
    drugs = db.query(Drug).all()
    if not drugs:
        logger.warning("No drugs found in the database")
        raise HTTPException(status_code=404, detail="No drugs found")
    return drugs

# 7. Mark Pharmacy Record as Paid (Cannot Be Undone)
@router.patch("/patients/{patient_id}/pharmacy/{record_id}/mark-as-paid", response_model=PharmacyOut)
def mark_pharmacy_record_as_paid(
    patient_id: str,
    record_id: int,
    db: Session = Depends(get_db)
):
    record = get_pharmacy_record(record_id, patient_id, db)
    if not record:
        raise HTTPException(status_code=404, detail=f"Pharmacy record {record_id} not found")

    if record.is_paid:
        logger.warning(f"Pharmacy record {record_id} is already marked as paid")
        raise HTTPException(status_code=400, detail="Pharmacy record is already marked as paid and cannot be undone.")

    record.is_paid = True
    db.commit()
    db.refresh(record)

    return record

# 8. Download Receipt (Updated with better formatting and drug name)
def generate_receipt_pdf(record, patient, db: Session, logo_url="http://localhost:3000/renewal.png"):
    buffer = BytesIO()
    pdf = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    content = []

    # Try to fetch the logo
    try:
        response = requests.get(logo_url, timeout=10)
        response.raise_for_status()
        logo_img = Image(BytesIO(response.content), width=200, height=100)
        content.append(logo_img)
    except requests.exceptions.RequestException as e:
        logger.warning(f"Could not load logo image: {e}")
        content.append(Paragraph("Pharmacy Receipt", styles['Title']))

    content.append(Spacer(1, 12))

    # Add a title
    title = Paragraph("Pharmacy Receipt", styles['Title'])
    content.append(title)
    content.append(Spacer(1, 12))

    # Add patient and record details
    patient_details = [
        f"Patient: {patient.surname}, {patient.other_names}",
        f"Medication: {record.medication_name}",
        f"Dosage and Route: {record.dosage_and_route}",
        f"Frequency: {record.frequency}",
        f"Dispensation Date: {record.dispensation_date}",
    ]
    for detail in patient_details:
        content.append(Paragraph(detail, styles['BodyText']))
        content.append(Spacer(1, 6))

    # Add a table for drug orders
    drug_orders = [["Drug Name", "Quantity", "Price"]]
    for order in record.drug_orders:
        # Ensure drug_name exists in the order
        if "drug_name" not in order:
            drug = get_drug(order["drug_id"], db)
            order["drug_name"] = drug.name  # Fetch drug name from the database

        drug_orders.append([order["drug_name"], order["quantity"], f"NGN{order['price']:.2f}"])

    table = Table(drug_orders)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    content.append(Spacer(1, 12))
    content.append(table)

    # Add total cost
    total_cost = sum(order["price"] * order["quantity"] for order in record.drug_orders)
    total_cost_paragraph = Paragraph(f"Total Cost: NGN{total_cost:.2f}", styles['BodyText'])
    content.append(Spacer(1, 12))
    content.append(total_cost_paragraph)

    # Add a footer
    footer = Paragraph("Thank you for choosing our pharmacy. For inquiries, contact support@example.com.", styles['Italic'])
    content.append(Spacer(1, 12))
    content.append(footer)

    # Build the PDF
    pdf.build(content)

    # Return the PDF as bytes
    buffer.seek(0)
    return buffer.getvalue()

@router.get("/patients/{patient_id}/pharmacy/{record_id}/download-receipt")
def download_receipt(
    patient_id: str,
    record_id: int,
    db: Session = Depends(get_db)
):
    record = get_pharmacy_record(record_id, patient_id, db)
    if not record.is_paid:
        logger.warning(f"Pharmacy record {record_id} is not paid. Cannot generate receipt.")
        raise HTTPException(status_code=400, detail="Pharmacy record is not paid. Cannot generate receipt.")

    patient = get_patient(patient_id, db)

    # Generate the PDF
    pdf_bytes = generate_receipt_pdf(record, patient, db)

    # Prepare the response
    headers = {
        "Content-Disposition": f"attachment; filename=receipt_{record.pharmacy_id}.pdf",
        "Content-Type": "application/pdf",
    }
    return Response(pdf_bytes, headers=headers)
