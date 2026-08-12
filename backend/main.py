from fastapi import FastAPI
from database import engine, Base, SessionLocal
from models import Cliente, Presupuesto, Material
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

clientes = []

@app.get("/")
def root():
    return {"message": "Gestor de presupuestos funcionando correctamente."}


@app.get("/api/clientes")
def obtener_clientes():

    db = SessionLocal()

    try:
        clientes = db.query(Cliente).all()

        return [
            {
                "id": cliente.id,
                "nombre": cliente.nombre,
                "telefono": cliente.telefono,
                "email": cliente.email
            }
            for cliente in clientes
        ]

    finally:
        db.close()




@app.post("/api/clientes")
def crear_cliente(cliente: dict):

    db = SessionLocal()

    try:
        nuevo_cliente = Cliente(
            nombre=cliente.get("nombre"),
            telefono=cliente.get("telefono"),
            email=cliente.get("email")
        )

        db.add(nuevo_cliente)
        db.commit()
        db.refresh(nuevo_cliente)

        return {
            "id": nuevo_cliente.id,
            "nombre": nuevo_cliente.nombre,
            "telefono": nuevo_cliente.telefono,
            "email": nuevo_cliente.email
        }

    finally:
        db.close()

@app.put("/api/clientes/{cliente_id}")
def editar_cliente(
    cliente_id: int,
    cliente: dict
):
    db = SessionLocal()

    try:
        cliente_db = (
            db.query(Cliente)
            .filter(Cliente.id == cliente_id)
            .first()
        )

        if not cliente_db:
            return {
                "error": "Cliente no encontrado"
            }

        cliente_db.nombre = cliente.get(
            "nombre",
            cliente_db.nombre
        )

        cliente_db.telefono = cliente.get(
            "telefono",
            cliente_db.telefono
        )

        cliente_db.email = cliente.get(
            "email",
            cliente_db.email
        )

        cliente_db.direccion = cliente.get(
            "direccion",
            cliente_db.direccion
        )

        db.commit()
        db.refresh(cliente_db)

        return {
            "id": cliente_db.id,
            "nombre": cliente_db.nombre,
            "telefono": cliente_db.telefono,
            "email": cliente_db.email,
            "direccion": cliente_db.direccion
        }

    finally:
        db.close()


presupuestos = []


@app.get("/api/presupuestos")
def obtener_presupuestos():

    db = SessionLocal()

    try:
        presupuestos_db = db.query(Presupuesto).all()

        return [
            {
                "id": presupuesto.id,
                "cliente_id": presupuesto.cliente_id,
                "descripcion": presupuesto.descripcion,
                "mano_de_obra": presupuesto.mano_de_obra,
                "total": presupuesto.total,
                "estado": presupuesto.estado,
                "materiales": [
                    {
                        "id": material.id,
                        "nombre": material.nombre,
                        "cantidad": material.cantidad,
                        "precio": material.precio
                    }
                    for material in presupuesto.materiales
                ]
            }
            for presupuesto in presupuestos_db
        ]

    finally:
        db.close()



@app.post("/api/presupuestos")
def crear_presupuesto(presupuesto: dict):

    db = SessionLocal()

    try:
        nuevo_presupuesto = Presupuesto(
            cliente_id=presupuesto.get("cliente_id"),
            descripcion=presupuesto.get("descripcion"),
            mano_de_obra=presupuesto.get("mano_de_obra", 0),
            total=presupuesto.get("total", 0),
            estado="pendiente"
        )

        db.add(nuevo_presupuesto)
        db.commit()
        db.refresh(nuevo_presupuesto)

        for material in presupuesto.get("materiales", []):

            nuevo_material = Material(
                presupuesto_id=nuevo_presupuesto.id,
                nombre=material.get("nombre"),
                cantidad=material.get("cantidad", 0),
                precio=material.get("precio", 0)
            )

            db.add(nuevo_material)

        db.commit()

        return {
            "id": nuevo_presupuesto.id,
            "cliente_id": nuevo_presupuesto.cliente_id,
            "descripcion": nuevo_presupuesto.descripcion,
            "mano_de_obra": nuevo_presupuesto.mano_de_obra,
            "total": nuevo_presupuesto.total,
            "estado": nuevo_presupuesto.estado,
            "materiales": [
                {
                    "id": material.id,
                    "nombre": material.nombre,
                    "cantidad": material.cantidad,
                    "precio": material.precio
                }
                for material in nuevo_presupuesto.materiales
            ]
        }

    finally:
        db.close()

@app.delete("/api/presupuestos/{presupuesto_id}")
def eliminar_presupuesto(presupuesto_id: int):
    db = SessionLocal()

    try:
        presupuesto_db = (
            db.query(Presupuesto)
            .filter(Presupuesto.id == presupuesto_id)
            .first()
        )

        if not presupuesto_db:
            return {
                "error": "Presupuesto no encontrado"
            }

        db.query(Material).filter(
            Material.presupuesto_id == presupuesto_id
        ).delete()

        db.delete(presupuesto_db)
        db.commit()

        return {
            "mensaje": "Presupuesto eliminado correctamente"
        }

    finally:
        db.close()

@app.put("/api/presupuestos/{presupuesto_id}")
def editar_presupuesto(
    presupuesto_id: int,
    presupuesto: dict
):
    db = SessionLocal()

    try:
        presupuesto_db = (
            db.query(Presupuesto)
            .filter(Presupuesto.id == presupuesto_id)
            .first()
        )

        if not presupuesto_db:
            return {
                "error": "Presupuesto no encontrado"
            }

        presupuesto_db.cliente_id = presupuesto.get(
            "cliente_id",
            presupuesto_db.cliente_id
        )

        presupuesto_db.descripcion = presupuesto.get(
            "descripcion",
            presupuesto_db.descripcion
        )

        presupuesto_db.mano_de_obra = presupuesto.get(
            "mano_de_obra",
            presupuesto_db.mano_de_obra
        )

        presupuesto_db.total = presupuesto.get(
            "total",
            presupuesto_db.total
        )

        db.query(Material).filter(
            Material.presupuesto_id == presupuesto_id
        ).delete()

        for material in presupuesto.get("materiales", []):

            nuevo_material = Material(
                presupuesto_id=presupuesto_id,
                nombre=material.get("nombre"),
                cantidad=material.get("cantidad", 0),
                precio=material.get("precio", 0)
            )

            db.add(nuevo_material)

        db.commit()
        db.refresh(presupuesto_db)

        return {
            "id": presupuesto_db.id,
            "cliente_id": presupuesto_db.cliente_id,
            "descripcion": presupuesto_db.descripcion,
            "mano_de_obra": presupuesto_db.mano_de_obra,
            "total": presupuesto_db.total,
            "estado": presupuesto_db.estado,
            "materiales": [
                {
                    "id": material.id,
                    "nombre": material.nombre,
                    "cantidad": material.cantidad,
                    "precio": material.precio
                }
                for material in presupuesto_db.materiales
            ]
        }

    finally:
        db.close()

@app.put("/api/presupuestos/{presupuesto_id}/estado")
def cambiar_estado_presupuesto(
    presupuesto_id: int,
    nuevo_estado: dict
):
    db = SessionLocal()

    try:
        presupuesto_db = (
            db.query(Presupuesto)
            .filter(Presupuesto.id == presupuesto_id)
            .first()
        )

        if not presupuesto_db:
            return {
                "error": "Presupuesto no encontrado"
            }

        presupuesto_db.estado = nuevo_estado.get(
            "estado",
            presupuesto_db.estado
        )

        db.commit()
        db.refresh(presupuesto_db)

        return {
            "id": presupuesto_db.id,
            "cliente_id": presupuesto_db.cliente_id,
            "descripcion": presupuesto_db.descripcion,
            "mano_de_obra": presupuesto_db.mano_de_obra,
            "total": presupuesto_db.total,
            "estado": presupuesto_db.estado,
            "materiales": [
                {
                    "id": material.id,
                    "nombre": material.nombre,
                    "cantidad": material.cantidad,
                    "precio": material.precio
                }
                for material in presupuesto_db.materiales
            ]
        }

    finally:
        db.close()
