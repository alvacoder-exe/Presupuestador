from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    telefono = Column(String, nullable=True)
    email = Column(String, nullable=True)

    presupuestos = relationship(
        "Presupuesto",
        back_populates="cliente"
    )


class Presupuesto(Base):
    __tablename__ = "presupuestos"

    id = Column(Integer, primary_key=True, index=True)

    cliente_id = Column(
        Integer,
        ForeignKey("clientes.id"),
        nullable=False
    )

    descripcion = Column(String, nullable=False)
    mano_de_obra = Column(Float, default=0)
    total = Column(Float, default=0)
    estado = Column(
        String,
        default="pendiente"
    )

    cliente = relationship(
        "Cliente",
        back_populates="presupuestos"
    )

    materiales = relationship(
    "Material",
    back_populates="presupuesto",
    cascade="all, delete-orphan"
    )

class Material(Base):
    __tablename__ = "materiales"

    id = Column(Integer, primary_key=True, index=True)

    presupuesto_id = Column(
        Integer,
        ForeignKey("presupuestos.id"),
        nullable=False
    )

    nombre = Column(String, nullable=False)
    cantidad = Column(Float, default=0)
    precio = Column(Float, default=0)

    presupuesto = relationship(
        "Presupuesto",
        back_populates="materiales"
    )