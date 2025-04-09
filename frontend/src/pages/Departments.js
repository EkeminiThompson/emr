import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

// Styled components for Departments page
const Container = styled.div`
  padding: 20px;
  background-color: #f4f7fc;
`;

const Header = styled.h1`
  font-size: 2.5em;
  margin-bottom: 20px;
`;

const Description = styled.p`
  font-size: 1.2em;
  margin-bottom: 30px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const CardTitle = styled.h3`
  font-size: 1.5em;
  margin-bottom: 15px;
`;

const CardText = styled.p`
  font-size: 1.1em;
  margin-bottom: 20px;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: #007bff;
  font-size: 1.2em;
  font-weight: bold;
  padding: 10px;
  background-color: #e7f1fe;
  border-radius: 5px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #007bff;
    color: white;
    transform: translateY(-2px);
  }
`;

const Departments = () => {
  return (
    <Container>
      <Header>Departments</Header>
      <Description>
        Welcome to the department management dashboard. Select a department to view more details.
      </Description>

      <Grid>
        <Card>
          <CardTitle>Pharmacy</CardTitle>
          <CardText>View pharmacy details, medication dispensation, and more.</CardText>
          <StyledLink to="/pharmacy">Go to Pharmacy</StyledLink>
        </Card>

        <Card>
          <CardTitle>Laboratory</CardTitle>
          <CardText>Explore laboratory test results, statistics, and more.</CardText>
          <StyledLink to="/laboratory">Go to Laboratory</StyledLink>
        </Card>

        <Card>
          <CardTitle>Occupational Therapy</CardTitle>
          <CardText>Manage therapy sessions and track patient progress.</CardText>
          <StyledLink to="/occupational-therapy">Go to Occupational Therapy</StyledLink>
        </Card>

        <Card>
          <CardTitle>Clinical Psychology</CardTitle>
          <CardText>View patient psychology data, session information, and reports.</CardText>
          <StyledLink to="/clinical-psychology">Go to Psychology</StyledLink>
        </Card>

        <Card>
          <CardTitle>Social Work</CardTitle>
          <CardText>Manage and track social work interventions and patient data.</CardText>
          <StyledLink to="/social-work">Go to Social Work</StyledLink>
        </Card>

        <Card>
          <CardTitle>Outpatients</CardTitle>
          <CardText>Coordinate outpatients interventions and data.</CardText>
          <StyledLink to="/patient-details">Go to OutPatient</StyledLink>
        </Card>
      </Grid>
    </Container>
  );
};

export default Departments;
