import { useEffect, useState } from "react";
import "./App.css";
import jsPDF from "jspdf";

function App() {
  const [clientes, setClientes] = useState([]);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [presupuestos, setPresupuestos] = useState([]);
  const [presupuestoEditando, setPresupuestoEditando] = useState(null);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);
  const [pantalla, setPantalla] = useState("dashboard");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarFormularioPresupuesto, setMostrarFormularioPresupuesto] =
  useState(false);
  
  const [formularioPresupuesto, setFormularioPresupuesto] = useState({
    cliente_id: "",
    descripcion: "",
    mano_de_obra: "",
    });

    const [materiales, setMateriales] = useState([
      {
        nombre: "",
        cantidad: "",
        precio: "",
      },
  ]);

  const [formulario, setFormulario] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
  });

  // Obtener clientes desde FastAPI

useEffect(() => {
  // Obtener clientes
  fetch("https://gestor-presupuesto-api.onrender.com/api/clientes")
    .then((respuesta) => respuesta.json())
    .then((datos) => setClientes(datos))
    .catch((error) => {
      console.error("Error obteniendo clientes:", error);
    });

  // Obtener presupuestos
  fetch("https://gestor-presupuesto-api.onrender.com/api/presupuestos")
    .then((respuesta) => respuesta.json())
    .then((datos) => setPresupuestos(datos))
    .catch((error) => {
      console.error("Error obteniendo presupuestos:", error);
    });
}, []);


  const manejarCambio = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };


  const manejarCambioPresupuesto = (e) => {
    setFormularioPresupuesto({
      ...formularioPresupuesto,
      [e.target.name]: e.target.value,
    });
  };

  
  const manejarCambioMaterial = (indice, campo, valor) => {
    const nuevosMateriales = [...materiales];

    nuevosMateriales[indice][campo] = valor;

    setMateriales(nuevosMateriales);
  };

  const agregarMaterial = () => {
    setMateriales([
      ...materiales,
      {
        nombre: "",
        cantidad: "",
        precio: "",
      },
    ]);
  };

 
  const eliminarMaterial = (indice) => {
    const nuevosMateriales = materiales.filter(
      (_, i) => i !== indice
    );

    setMateriales(nuevosMateriales);
  };


  const calcularTotalMateriales = () => {
    return materiales.reduce((total, material) => {
      const cantidad = Number(material.cantidad) || 0;
      const precio = Number(material.precio) || 0;

      return total + cantidad * precio;
    }, 0);
  };

  const calcularTotalPresupuesto = () => {
    const manoDeObra = Number(formularioPresupuesto.mano_de_obra) || 0;

    return manoDeObra + calcularTotalMateriales();
  };

  const verPresupuesto = (presupuesto) => {
    setPresupuestoSeleccionado(presupuesto);
  };

  const editarPresupuesto = (presupuesto) => {
    setPresupuestoEditando(presupuesto);

    setFormularioPresupuesto({
      cliente_id: presupuesto.cliente_id,
      descripcion: presupuesto.descripcion,
      mano_de_obra: presupuesto.mano_de_obra,
    });

    setMateriales(
      presupuesto.materiales?.length
        ? presupuesto.materiales
        : [
            {
              nombre: "",
              cantidad: "",
              precio: "",
            },
          ]
    );

    setMostrarFormularioPresupuesto(true);
  };

  const eliminarPresupuesto = async (presupuesto) => {
    const confirmar = window.confirm(
      `¿Querés eliminar el presupuesto #${presupuesto.id}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      const respuesta = await fetch(
        `https://gestor-presupuesto-api.onrender.com/api/presupuestos/${presupuesto.id}`,
        {
          method: "DELETE",
        }
      );

      if (!respuesta.ok) {
        const error = await respuesta.text();
        throw new Error(error);
      }

      setPresupuestos(
        presupuestos.filter(
          (item) => item.id !== presupuesto.id
        )
      );

      if (
        presupuestoSeleccionado &&
        presupuestoSeleccionado.id === presupuesto.id
      ) {
        setPresupuestoSeleccionado(null);
      }

    } catch (error) {
      console.error("Error eliminando presupuesto:", error);
    }
  };

  const generarPDF = (presupuesto) => {
    const doc = new jsPDF();

    const cliente = clientes.find(
      (cliente) => cliente.id === presupuesto.cliente_id
    );

    doc.setFontSize(20);
    doc.text("PRESUPUESTO", 20, 20);

    doc.setFontSize(12);
    doc.text(`Presupuesto #${presupuesto.id}`, 20, 30);

    doc.text(
      `Cliente: ${cliente ? cliente.nombre : "Cliente desconocido"}`,
      20,
      42
    );

    if (cliente?.telefono) {
      doc.text(`Teléfono: ${cliente.telefono}`, 20, 50);
    }

    if (cliente?.direccion) {
      doc.text(`Dirección: ${cliente.direccion}`, 20, 58);
    }

    doc.text(`Descripción: ${presupuesto.descripcion}`, 20, 70);

    doc.setFontSize(14);
    doc.text("Materiales", 20, 85);

    let posicionY = 95;

    presupuesto.materiales?.forEach((material) => {
      const subtotal =
        Number(material.cantidad) * Number(material.precio);

      doc.setFontSize(11);

      doc.text(
        `${material.nombre} - ${material.cantidad} x $${Number(
          material.precio
        ).toLocaleString("es-AR")}`,
        20,
        posicionY
      );

      doc.text(
        `$${subtotal.toLocaleString("es-AR")}`,
        160,
        posicionY
      );

      posicionY += 8;
    });

    posicionY += 8;

    doc.text(
      `Mano de obra: $${Number(
        presupuesto.mano_de_obra
      ).toLocaleString("es-AR")}`,
      20,
      posicionY
    );

    posicionY += 10;

    doc.setFontSize(16);

    doc.text(
      `TOTAL: $${Number(presupuesto.total).toLocaleString("es-AR")}`,
      20,
      posicionY
    );

    posicionY += 10;

    doc.setFontSize(12);

    doc.text(
      `Estado: ${presupuesto.estado}`,
      20,
      posicionY
    );

    doc.save(`presupuesto-${presupuesto.id}.pdf`);
  };

  const crearPresupuesto = async (e) => {
    e.preventDefault();

      if (presupuestoEditando) {
        try {
          const respuesta = await fetch(
            `https://gestor-presupuesto-api.onrender.com/api/presupuestos/${presupuestoEditando.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                cliente_id: Number(formularioPresupuesto.cliente_id),
                descripcion: formularioPresupuesto.descripcion,
                materiales: materiales.map((material) => ({
                  nombre: material.nombre,
                  cantidad: Number(material.cantidad),
                  precio: Number(material.precio),
                })),
                mano_de_obra: Number(formularioPresupuesto.mano_de_obra),
                total: calcularTotalPresupuesto(),
              }),
            }
          );

          if (!respuesta.ok) {
            const error = await respuesta.text();
            throw new Error(error);
          }

          const presupuestoActualizado = await respuesta.json();

          setPresupuestos(
            presupuestos.map((presupuesto) =>
              presupuesto.id === presupuestoActualizado.id
                ? presupuestoActualizado
                : presupuesto
            )
          );

          setPresupuestoEditando(null);
          setMostrarFormularioPresupuesto(false);

          setFormularioPresupuesto({
            cliente_id: "",
            descripcion: "",
            mano_de_obra: "",
          });

          setMateriales([
            {
              nombre: "",
              cantidad: "",
              precio: "",
            },
          ]);

            return;
        } catch (error) {
          console.error("Error editando presupuesto:", error);
          return;
        }
      }

    try {
      const respuesta = await fetch(
        "https://gestor-presupuesto-api.onrender.com/api/presupuestos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
          cliente_id: Number(formularioPresupuesto.cliente_id),
          descripcion: formularioPresupuesto.descripcion,

          materiales: materiales.map((material) => ({
            nombre: material.nombre,
            cantidad: Number(material.cantidad),
            precio: Number(material.precio),
          })),

          mano_de_obra: Number(formularioPresupuesto.mano_de_obra),

          total: calcularTotalPresupuesto(),
        }),
        }
      );

      if (!respuesta.ok) {
        const error = await respuesta.text();
        throw new Error(error);
      }

      const nuevoPresupuesto = await respuesta.json();

      setPresupuestos([...presupuestos, nuevoPresupuesto]);

      setFormularioPresupuesto({
        cliente_id: "",
        descripcion: "",
        mano_de_obra: "",
      });
      setFormularioPresupuesto({
        cliente_id: "",
        descripcion: "",
        mano_de_obra: "",
        material_nombre: "",
        material_cantidad: "",
        material_precio: "",
      });

      setMostrarFormularioPresupuesto(false);

    } catch (error) {
      console.error("Error creando presupuesto:", error);
    }
  };


  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const respuesta = await fetch(
        `https://gestor-presupuesto-api.onrender.com/api/presupuestos/${id}/estado`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado: nuevoEstado,
          }),
        }
      );

      const presupuestoActualizado = await respuesta.json();

      setPresupuestos(
        presupuestos.map((presupuesto) =>
          presupuesto.id === id
            ? presupuestoActualizado
            : presupuesto
        )
      );

    } catch (error) {
      console.error(
        "Error cambiando estado:",
        error
      );
    }
  };

  const editarCliente = (cliente) => {
    setClienteEditando(cliente);

    setFormulario({
      nombre: cliente.nombre,
      telefono: cliente.telefono || "",
      email: cliente.email || "",
      direccion: cliente.direccion || "",
    });

    setMostrarFormulario(true);
  };

  const crearCliente = async (e) => {
    e.preventDefault();

    try {

      if (clienteEditando) {

        const respuesta = await fetch(
          `https://gestor-presupuesto-api.onrender.com/api/clientes/${clienteEditando.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formulario),
          }
        );

        if (!respuesta.ok) {
          const error = await respuesta.text();
          throw new Error(error);
        }

        const clienteActualizado = await respuesta.json();

        setClientes(
          clientes.map((cliente) =>
            cliente.id === clienteActualizado.id
              ? clienteActualizado
              : cliente
          )
        );

        setClienteEditando(null);

      } else {

        const respuesta = await fetch(
          "https://gestor-presupuesto-api.onrender.com/api/clientes",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formulario),
          }
        );

        if (!respuesta.ok) {
          const error = await respuesta.text();
          throw new Error(error);
        }

        const nuevoCliente = await respuesta.json();

        setClientes([
          ...clientes,
          nuevoCliente
        ]);
      }

      setFormulario({
        nombre: "",
        telefono: "",
        email: "",
        direccion: "",
      });

      setMostrarFormulario(false);

    } catch (error) {
      console.error("Error guardando cliente:", error);
    }
  };

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">P</div>
          <span>PresuGest</span>
        </div>

        <nav>
          <a
            className={pantalla === "dashboard" ? "active" : ""}
            onClick={() => setPantalla("dashboard")}
          >
            Dashboard
          </a>

          <a
            className={pantalla === "clientes" ? "active" : ""}
            onClick={() => setPantalla("clientes")}
          >
            Clientes
          </a>

          <a
            className={pantalla === "presupuestos" ? "active" : ""}
            onClick={() => setPantalla("presupuestos")}
          >
            Presupuestos
          </a>
          <a>Configuración</a>
        </nav>
      </aside>


      {/* CONTENIDO */}

      <main className="main">

        {/* ===================== */}
        {/* DASHBOARD */}
        {/* ===================== */}

        {pantalla === "dashboard" && (
          <>
            <header className="header">

              <div>
                <h1>Dashboard</h1>
                <p>Gestioná tus clientes y presupuestos.</p>
              </div>

              <div className="header-actions">

                <button
                  className="new-budget"
                  onClick={() => {
                    setFormulario({
                      nombre: "",
                      telefono: "",
                      email: "",
                      direccion: "",
                    });

                    setPantalla("clientes");
                    setMostrarFormulario(true);
                  }}
                >
                  + Nuevo cliente
                </button>

                <button
                  className="new-budget"
                  onClick={() => {

                    if (clientes.length === 0) {
                      alert("Primero tenés que crear un cliente.");
                      return;
                    }

                    setPresupuestoEditando(null);
                    
                    setFormularioPresupuesto({
                      cliente_id: "",
                      descripcion: "",
                      mano_de_obra: "",
                    });

                    setMateriales([
                      {
                        nombre: "",
                        cantidad: "",
                        precio: "",
                      },
                    ]);

                    setPantalla("presupuestos");
                    setMostrarFormularioPresupuesto(true);
                  }}
                >
                  + Nuevo presupuesto
                </button>

              </div>

            </header>


            <section className="stats">

              <div className="stat-card">
                <span>Clientes</span>
                <strong>{clientes.length}</strong>
                <small>Clientes registrados</small>
              </div>

              <div className="stat-card">
                <span>Presupuestos</span>
                <strong>{presupuestos.length}</strong>
                <small>Registrados</small>
              </div>

              <div className="stat-card">
                <span>Pendientes</span>
                <strong>
                  {presupuestos.filter(
                    (presupuesto) => presupuesto.estado === "pendiente"
                  ).length}
                </strong>
                <small>Para revisar</small>
              </div>

              <div className="stat-card">
                <span>Aceptados</span>
                <strong>
                  {presupuestos.filter(
                    (presupuesto) => presupuesto.estado === "aceptado"
                  ).length}
                </strong>
                <small>Este mes</small>
              </div>

              <div className="stat-card">
                  <span>Total presupuestado</span>

                  <strong>
                    $
                    {presupuestos
                      .reduce(
                        (total, presupuesto) =>
                          total + (Number(presupuesto.total) || 0),
                        0
                      )
                      .toLocaleString("es-AR")}
                  </strong>

                  <small>Suma de todos los presupuestos</small>
                </div>

                <div className="stat-card">
                  <span>Total aceptado</span>

                  <strong>
                    $
                    {presupuestos
                      .filter(
                        (presupuesto) => presupuesto.estado === "aceptado"
                      )
                      .reduce(
                        (total, presupuesto) =>
                          total + (Number(presupuesto.total) || 0),
                        0
                      )
                      .toLocaleString("es-AR")}
                  </strong>

                  <small>Presupuestos aceptados</small>
                </div>

            </section>


            <section className="card">

              <div className="card-header">
                <div>
                  <h2>Últimos clientes</h2>
                  <p>Clientes registrados recientemente.</p>
                </div>

                <button
                  className="link-button"
                  onClick={() => setPantalla("clientes")}
                >
                  Ver todos
                </button>
              </div>


              {clientes.length === 0 ? (
                <p>No hay clientes registrados todavía.</p>
              ) : (
                clientes.slice(-3).reverse().map((cliente) => (
                  <div className="budget-item" key={cliente.id}>

                    <div>
                      <strong>{cliente.nombre}</strong>

                      <span>
                        {cliente.telefono || "Sin teléfono"}
                      </span>
                    </div>

                    <div className="budget-right">
                      <span>
                        {cliente.email || "Sin email"}
                      </span>
                    </div>

                  </div>
                ))
              )}

            </section>

              <section className="card">

                <div className="card-header">

                  <div>
                    <h2>Últimos presupuestos</h2>
                    <p>Presupuestos registrados recientemente.</p>
                  </div>

                  <button
                    className="link-button"
                    onClick={() => setPantalla("presupuestos")}
                  >
                    Ver todos
                  </button>

                </div>


                {presupuestos.length === 0 ? (

                  <p>
                    No hay presupuestos registrados todavía.
                  </p>

                ) : (

                  presupuestos
                    .slice(-3)
                    .reverse()
                    .map((presupuesto) => {

                      const cliente = clientes.find(
                        (cliente) =>
                          cliente.id === presupuesto.cliente_id
                      );

                      return (

                        <div
                          className="budget-item"
                          key={presupuesto.id}
                        >

                          <div>

                            <strong>
                              Presupuesto #{presupuesto.id}
                            </strong>

                            <span>
                              {cliente
                                ? cliente.nombre
                                : "Cliente desconocido"}
                              {" · "}
                              {presupuesto.descripcion}
                            </span>

                          </div>


                          <div className="budget-right">

                            <strong>
                              $
                              {(
                                Number(presupuesto.total) || 0
                              ).toLocaleString("es-AR")}
                            </strong>

                            <span
                              className={`status ${presupuesto.estado}`}
                            >
                              {presupuesto.estado}
                            </span>

                          </div>

                        </div>

                      );
                    })

                )}

              </section>

          </>
        )}


        {/* ===================== */}
        {/* CLIENTES */}
        {/* ===================== */}

        {pantalla === "clientes" && (
          <>
            <header className="header">

              <div>
                <h1>Clientes</h1>
                <p>Administrá tus clientes.</p>
              </div>

              <button
                className="new-budget"
                onClick={() => setMostrarFormulario(true)}
              >
                + Nuevo cliente
              </button>

            </header>


            {/* FORMULARIO */}

            {mostrarFormulario && (
              <section className="card">

                <div className="card-header">

                  <div>
                    <h2>Nuevo cliente</h2>
                    <p>Completá los datos del cliente.</p>
                  </div>

                </div>


                <form onSubmit={crearCliente}>

                  <input
                    type="text"
                    name="nombre"
                    placeholder="Nombre completo"
                    value={formulario.nombre}
                    onChange={manejarCambio}
                    required
                  />

                  <input
                    type="text"
                    name="telefono"
                    placeholder="Teléfono"
                    value={formulario.telefono}
                    onChange={manejarCambio}
                  />

                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formulario.email}
                    onChange={manejarCambio}
                  />

                  <input
                    type="text"
                    name="direccion"
                    placeholder="Dirección"
                    value={formulario.direccion}
                    onChange={manejarCambio}
                  />


                  <button
                    type="submit"
                    className="new-budget"
                  >
                    Guardar cliente
                  </button>


                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                  >
                    Cancelar
                  </button>

                </form>

              </section>
            )}


            {/* LISTA DE CLIENTES */}

            <section className="card">

              <div className="card-header">

                <div>
                  <h2>Todos los clientes</h2>

                  <p>
                    {clientes.length} cliente
                    {clientes.length !== 1 ? "s" : ""} registrado
                    {clientes.length !== 1 ? "s" : ""}
                  </p>
                </div>

              </div>


              {clientes.length === 0 ? (

                <p>No hay clientes registrados todavía.</p>

              ) : (

                <div className="budget-list">

                  {clientes.map((cliente) => (

                    <div
                      className="budget-item"
                      key={cliente.id}
                    >

                      <div>

                        <strong>
                          {cliente.nombre}
                        </strong>

                        <span>
                          {cliente.telefono || "Sin teléfono"}
                          {" · "}
                          {cliente.email || "Sin email"}
                        </span>

                      </div>


                      <div className="budget-right">

                        <span>
                          {cliente.direccion || "Sin dirección"}
                        </span>

                        <div className="budget-actions">

                          <button
                            className="edit-budget-button"
                            onClick={() => editarCliente(cliente)}
                          >
                            Editar
                          </button>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </section>

          </>
        )}


         {/* ===================== */}
         {/* PRESUPUESTOS */}
        {/* ===================== */}

        {pantalla === "presupuestos" && (
          <>
              <header className="header">

                <div>
                  <h1>Presupuestos</h1>
                  <p>Administrá tus presupuestos.</p>
                </div>

                <button
                  className="new-budget"
                  onClick={() => setMostrarFormularioPresupuesto(true)}
                >
                  + Nuevo presupuesto
                </button>

              </header>

                            
              {mostrarFormularioPresupuesto && (
                <section className="card">

                  <div className="card-header">
                    <div>
                      <h2>Nuevo presupuesto</h2>
                      <p>Completá los datos básicos del presupuesto.</p>
                    </div>
                  </div>

                  <form onSubmit={crearPresupuesto}>

                    <select
                      name="cliente_id"
                      value={formularioPresupuesto.cliente_id}
                      onChange={manejarCambioPresupuesto}
                      required
                    >
                      <option value="">Seleccionar cliente</option>

                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nombre}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      name="descripcion"
                      value={formularioPresupuesto.descripcion}
                      onChange={manejarCambioPresupuesto}
                      placeholder="Descripción del trabajo"
                      required
                    />

                    <input
                      type="number"
                      name="mano_de_obra"
                      value={formularioPresupuesto.mano_de_obra}
                      onChange={manejarCambioPresupuesto}
                      placeholder="Mano de obra"
                      required
                    />

                    
                    <div className="materiales-form">

                      <h3>Materiales</h3>

                      {materiales.map((material, indice) => (
                        <div className="material-row" key={indice}>

                          <input
                            type="text"
                            placeholder="Material"
                            value={material.nombre}
                            onChange={(e) =>
                              manejarCambioMaterial(
                                indice,
                                "nombre",
                                e.target.value
                              )
                            }
                          />

                          <input
                            type="number"
                            placeholder="Cantidad"
                            value={material.cantidad}
                            onChange={(e) =>
                              manejarCambioMaterial(
                                indice,
                                "cantidad",
                                e.target.value
                              )
                            }
                          />

                          <input
                            type="number"
                            placeholder="Precio unitario"
                            value={material.precio}
                            onChange={(e) =>
                              manejarCambioMaterial(
                                indice,
                                "precio",
                                e.target.value
                              )
                            }
                          />

                          {materiales.length > 1 && (
                            <button
                              type="button"
                              onClick={() => eliminarMaterial(indice)}
                            >
                              Eliminar
                            </button>
                          )}

                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={agregarMaterial}
                      >
                        + Agregar material
                      </button>

                    </div>
                      
                      
                    <div className="presupuesto-total">

                      <span>Total materiales</span>

                      <strong>
                        ${calcularTotalMateriales().toLocaleString("es-AR")}
                      </strong>

                      <span>Mano de obra</span>

                      <strong>
                        ${(
                          Number(formularioPresupuesto.mano_de_obra) || 0
                        ).toLocaleString("es-AR")}
                      </strong>

                      <div className="total-final">

                        <span>Total</span>

                        <strong>
                          ${calcularTotalPresupuesto().toLocaleString("es-AR")}
                        </strong>

                      </div>

                    </div>

                    <div className="presupuesto-total">

                      <span>Total materiales</span>

                      <strong>
                        ${calcularTotalMateriales().toLocaleString("es-AR")}
                      </strong>

                      <span>Mano de obra</span>

                      <strong>
                        {(Number(formularioPresupuesto.mano_de_obra) || 0)
                          .toLocaleString("es-AR")}
                      </strong>

                      <div className="total-final">
                        <span>Total</span>

                        <strong>
                          ${calcularTotalPresupuesto().toLocaleString("es-AR")}
                        </strong>
                      </div>

                    </div>


                    <button type="submit">
                      {presupuestoEditando
                        ? "Actualizar presupuesto"
                        : "Guardar presupuesto"}
                    </button> 

                    <button
                      type="button"
                      onClick={() => setMostrarFormularioPresupuesto(false)}
                    >
                      Cancelar
                    </button>

                  </form>

                </section>
               
              )}



              <section className="card">

                <div className="card-header">

                  <div>
                    <h2>Todos los presupuestos</h2>

                    <p>
                      {presupuestos.length} presupuesto
                      {presupuestos.length !== 1 ? "s" : ""} registrado
                      {presupuestos.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                </div>


                {presupuestos.length === 0 ? (

                  <p>No hay presupuestos registrados todavía.</p>

                  ) : (

                  <div className="budget-list">

                    {presupuestos.map((presupuesto) => {

                      const cliente = clientes.find(
                        (cliente) => cliente.id === presupuesto.cliente_id
                      );

                      return (
                        <div
                          className="budget-item"
                          key={presupuesto.id}
                        >

                          <div>

                            <strong>
                              Presupuesto #{presupuesto.id}
                            </strong>

                            <span>
                              {cliente
                                ? cliente.nombre
                                : "Cliente desconocido"}
                              {" · "}
                              {presupuesto.descripcion}
                            </span>

                          </div>


                          <div className="budget-right">

                            <strong>
                              ${(Number(presupuesto.total) || 0).toLocaleString("es-AR")}
                            </strong>

                            <div className="budget-actions">

                              <button
                                className="view-budget-button"
                                onClick={() => verPresupuesto(presupuesto)}
                              >
                                Ver
                              </button>

                              <button
                                className="edit-budget-button"
                                onClick={() => editarPresupuesto(presupuesto)}
                              >
                                Editar
                              </button>

                              <button
                                className="pdf-budget-button"
                                onClick={() => generarPDF(presupuesto)}
                              >
                                PDF
                              </button>

                              <button
                                className="delete-budget-button"
                                onClick={() => eliminarPresupuesto(presupuesto)}
                              >
                                Eliminar
                              </button>

                              <select
                                value={presupuesto.estado}
                                onChange={(e) =>
                                  cambiarEstado(
                                    presupuesto.id,
                                    e.target.value
                                  )
                                }
                                className={`status-select ${presupuesto.estado}`}
                              >
                                <option value="pendiente">
                                  Pendiente
                                </option>

                                <option value="aceptado">
                                  Aceptado
                                </option>

                                <option value="terminado">
                                  Terminado
                                </option>
                              </select>

                            </div>

                          </div>

                        </div>
                      );

                    })}

                  </div>

                )}

              </section>
            {presupuestoSeleccionado && (
              <section className="card budget-detail">

                <div className="card-header">

                  <div>
                    <h2>
                      Presupuesto #{presupuestoSeleccionado.id}
                    </h2>

                    <p>
                      Detalle del presupuesto
                    </p>
                  </div>

                  <button
                    onClick={() => setPresupuestoSeleccionado(null)}
                  >
                    Cerrar
                  </button>

                </div>


                <div className="budget-detail-info">

                  <div>
                    <strong>Cliente</strong>

                    <span>
                      {clientes.find(
                        (cliente) =>
                          cliente.id === presupuestoSeleccionado.cliente_id
                      )?.nombre || "Cliente desconocido"}
                    </span>
                  </div>


                  <div>
                    <strong>Descripción</strong>

                    <span>
                      {presupuestoSeleccionado.descripcion}
                    </span>
                  </div>


                  <div>
                    <strong>Estado</strong>

                    <span className={`status ${presupuestoSeleccionado.estado}`}>
                      {presupuestoSeleccionado.estado}
                    </span>
                  </div>

                </div>


                <div className="budget-detail-materials">

                  <h3>Materiales</h3>

                  {presupuestoSeleccionado.materiales?.length > 0 ? (

                    presupuestoSeleccionado.materiales.map((material) => (

                      <div
                        className="material-detail-item"
                        key={material.id}
                      >

                        <span>
                          {material.nombre}
                        </span>

                        <span>
                          {material.cantidad} x $
                          {Number(material.precio).toLocaleString("es-AR")}
                        </span>

                        <strong>
                          $
                          {(
                            Number(material.cantidad) *
                            Number(material.precio)
                          ).toLocaleString("es-AR")}
                        </strong>

                      </div>

                    ))

                  ) : (

                    <p>
                      No hay materiales registrados.
                    </p>

                  )}

                </div>


                <div className="budget-detail-total">

                  <div>
                    <span>Mano de obra</span>

                    <strong>
                      $
                      {Number(
                        presupuestoSeleccionado.mano_de_obra
                      ).toLocaleString("es-AR")}
                    </strong>
                  </div>


                  <div>
                    <span>Total</span>

                    <strong>
                      $
                      {Number(
                        presupuestoSeleccionado.total
                      ).toLocaleString("es-AR")}
                    </strong>
                  </div>

                </div>

              </section>
            )}
          </>
        )}


      </main>

    </div>
  );
}

export default App;

