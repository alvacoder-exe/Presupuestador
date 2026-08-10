from fastapi import FastAPI
from database import engine, Base, SessionLocal
from models import Cliente, Presupuesto, Material
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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


@app.put("/api/presupuestos/{presupuesto_id}/estado")
def cambiar_estado_presupuesto(presupuesto_id: int, nuevo_estado: dict):

    for presupuesto in presupuestos:

        if presupuesto["id"] == presupuesto_id:

            presupuesto["estado"] = nuevo_estado.get(
                "estado",
                presupuesto["estado"]
            )

        return presupuesto

    return {
        "error": "Presupuesto no encontrado."
    }


@app.get("/api/db-test")
def probar_base_datos():
    from database import SessionLocal

    db = SessionLocal()

    try:
        clientes = db.query(Cliente).all()

        return {
            "conexion": "ok",
            "cantidad_clientes": len(clientes)
        }

    finally:
        db.close()

