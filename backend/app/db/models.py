"""
ORM models for the Causal-Graph Edge AI Fleet system.
This is the full locked schema — every table used by every module.
"""
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, ForeignKeyConstraint
)
from sqlalchemy.orm import relationship

from app.db.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    status = Column(String, default="nominal")  # nominal | warning | critical
    created_at = Column(DateTime, default=datetime.utcnow)

    sensor_readings = relationship("SensorReading", back_populates="vehicle")
    anomaly_events = relationship("AnomalyEvent", back_populates="vehicle")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    subsystem = Column(String, nullable=False)
    sensor_type = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    is_anomalous = Column(Boolean, default=False)

    vehicle = relationship("Vehicle", back_populates="sensor_readings")


class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    subsystem = Column(String, nullable=False)
    sensor_type = Column(String, nullable=False)
    score = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    description = Column(String, default="")

    vehicle = relationship("Vehicle", back_populates="anomaly_events")


class CausalPropagationEvent(Base):
    __tablename__ = "causal_propagation_events"

    id = Column(Integer, primary_key=True, index=True)
    anomaly_event_id = Column(Integer, ForeignKey("anomaly_events.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    from_component = Column(String, nullable=False)
    to_component = Column(String, nullable=False)
    propagated_risk = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class ComponentRiskState(Base):
    __tablename__ = "component_risk_state"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    component = Column(String, nullable=False)
    risk_score = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow)


class ConsensusRound(Base):
    __tablename__ = "consensus_rounds"

    id = Column(Integer, primary_key=True, index=True)
    subsystem = Column(String, nullable=False)
    fault_pattern = Column(String, nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    result = Column(String, default="pending")  # pending | confirmed | rejected
    confidence = Column(Float, default=0.0)

    votes = relationship("ConsensusVote", back_populates="round")


class ConsensusVote(Base):
    __tablename__ = "consensus_votes"

    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("consensus_rounds.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    vote = Column(Boolean, nullable=False)
    confidence = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    round = relationship("ConsensusRound", back_populates="votes")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    component = Column(String, nullable=False)
    description = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # low | medium | high | critical
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    record_hash = Column(String, nullable=False, unique=True)
    prev_hash = Column(String, nullable=False)
    signature = Column(String, nullable=False)


class FaultInjection(Base):
    __tablename__ = "fault_injections"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    fault_type = Column(String, nullable=False)
    component = Column(String, nullable=False)
    magnitude = Column(Float, nullable=False)
    injected_at = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)
