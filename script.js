// --- CONFIGURACIONES ESTRUCTURALES DE LA JORNADA ESCOLAR ---
const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Definición estricta de las horas académicas de 45 minutos y recesos de 10 minutos
const cronogramaHoras = [
    { id: "H1", label: "07:00 - 07:45" },
    { id: "H2", label: "07:45 - 08:30" },
    { id: "R1", label: "08:30 - 08:40", receso: true },
    { id: "H3", label: "08:40 - 09:25" },
    { id: "H4", label: "09:25 - 10:10" },
    { id: "H5", label: "10:10 - 10:55" },
    { id: "H6", label: "10:55 - 11:40" },
    { id: "R2", label: "11:40 - 11:50", receso: true },
    { id: "H7", label: "11:50 - 12:35" },
    { id: "H8", label: "12:35 - 01:20" },
    { id: "H9", label: "01:20 - 02:05" },
    { id: "H10", label: "02:05 - 02:50" }
];

// Parejas de horas consecutivas para asegurar sesiones indivisibles de 90 minutos
const paresBloques = [
    { h1: "H1", h2: "H2" },
    { h1: "H3", h2: "H4" },
    { h1: "H5", h2: "H6" },
    { h1: "H7", h2: "H8" },
    { h1: "H9", h2: "H10" }
];

// Estructura institucional de los cursos y secciones
const cursosEstructura = [
    { anio: "1", secciones: ["A"] },
    { anio: "2", secciones: ["A", "B"] },
    { anio: "3", secciones: ["A", "B"] },
    { anio: "4", secciones: ["A", "B"] },
    { anio: "5", secciones: ["A"] }
];

// Inicialización de la aplicación al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    actualizarVistaMaterias();
    actualizarSelectMaterias();
    actualizarVistaProfesores();
    actualizarSeccionesDisponibles(document.getElementById('prof-anio').value);
    actualizarTablaHorarioVisual();
});

// FUNCIÓN DE NOTIFICACIONES TOAST PERSONALIZADAS
function mostrarNotificacion(mensaje, tipo = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.innerText = mensaje;
  
  container.appendChild(toast);
  
  // Remover la notificación del HTML automáticamente después de que termine la animación (3.3s)
  setTimeout(() => {
    toast.remove();
  }, 3300);
}

// Control de navegación entre pestañas (Tabs)
function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) tabContents[i].style.display = "none";
    const tabBtns = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabBtns.length; i++) tabBtns[i].classList.remove("active");
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
}

// Adaptación dinámica de las secciones según las restricciones del año escolar elegido
function actualizarSeccionesDisponibles(anio) {
    const selectSeccion = document.getElementById('prof-seccion');
    selectSeccion.innerHTML = '';
    if (!anio) return;
    
    const cursoEstructural = cursosEstructura.find(c => c.anio === anio);
    const secciones = cursoEstructural ? cursoEstructural.secciones : ["A", "B"];
    
    secciones.forEach(sec => {
        const opt = document.createElement('option');
        opt.value = sec; opt.textContent = `Sección ${sec}`;
        selectSeccion.appendChild(opt);
    });
}

// Variable global para rastrear la materia en edición
let idMateriaEditando = null;

// Función para cargar los datos de la tarjeta en el formulario superior
function cargarMateriaEnFormulario(id) {
  const materias = DB.obtenerMaterias();
  const materia = materias.find(m => m.id === id);
  
  if (!materia) return;
  
  // Asignar los valores actuales a los inputs del formulario
  document.getElementById('mat-nombre').value = materia.nombre;
  document.getElementById('mat-anio').value = materia.anio;
  document.getElementById('mat-horas').value = materia.horas;
  
  // Guardar el ID en la variable global
  idMateriaEditando = id;
  
  // Cambiar el texto del botón de registro para indicar actualización
  const btnSubmit = document.querySelector('#form-materia .btn-add');
  if (btnSubmit) {
    btnSubmit.textContent = "Actualizar Materia";
    btnSubmit.style.backgroundColor = "#2980b9"; // Cambia a azul para diferenciarlo
  }
  
  // Hacer un scroll suave hacia el formulario para comodidad del usuario
  document.getElementById('form-materia').scrollIntoView({ behavior: 'smooth' });
}

// CONTROLADOR DE FORMULARIO Y VISTA: MATERIAS (CON NOTIFICACIONES MEJORADAS)
document.getElementById('form-materia').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const nombre = document.getElementById('mat-nombre').value.trim();
  const anio = document.getElementById('mat-anio').value;
  const horas = parseInt(document.getElementById('mat-horas').value);
  
  let materiasExistentes = DB.obtenerMaterias();
  
  const yaExiste = materiasExistentes.some(m => 
    m.nombre.toLowerCase() === nombre.toLowerCase() && 
    m.anio === anio && 
    m.id !== idMateriaEditando
  );
  
  if (yaExiste) {
    // Alerta de Error Moderna
    mostrarNotificacion(`La asignatura "${nombre}" ya está registrada en ${anio}° Año.`, 'error');
    return;
  }
  
  if (idMateriaEditando) {
    // --- MODO EDICIÓN ---
    materiasExistentes = materiasExistentes.map(m => 
      m.id === idMateriaEditando ? { ...m, nombre, anio, horas } : m
    );
    
    localStorage.setItem('materias', JSON.stringify(materiasExistentes));
    idMateriaEditando = null;
    
    const btnSubmit = document.querySelector('#form-materia .btn-add');
    if (btnSubmit) {
      btnSubmit.textContent = "Registrar Materia";
      btnSubmit.style.backgroundColor = ""; 
    }
    
    // Alerta de Actualización Moderna
    mostrarNotificacion(`Asignatura "${nombre}" actualizada correctamente.`, 'info');
    
  } else {
    // --- MODO CREACIÓN NUEVA ---
    DB.guardarMateria({ 
      id: Date.now().toString(), 
      nombre, 
      anio, 
      horas 
    });
    
    // Alerta de Registro Exitoso Moderna
    mostrarNotificacion(`"${nombre}" registrada exitosamente.`, 'success');
  }
  
  this.reset();
  actualizarVistaMaterias();
  actualizarSelectMaterias();
});

// NUEVA FUNCIÓN: Genera fichas (cards) dinámicas en lugar de filas de tabla
function actualizarVistaMaterias() {
  const contenedor = document.getElementById('contenedor-fichas-materias');
  if (!contenedor) return;
  contenedor.innerHTML = '';
  
  // 1. Capturar los valores de los filtros (si los elementos ya existen en el HTML)
  const filtroBusqueda = document.getElementById('buscar-materia')?.value.toLowerCase().trim() || '';
  const filtroAnio = document.getElementById('filtrar-anio')?.value || 'todos';
  
  let materias = DB.obtenerMaterias();
  
  // 2. Aplicar los filtros secuencialmente
  materias = materias.filter(m => {
    // Filtrar por texto coincidente en el nombre
    const coincideTexto = m.nombre.toLowerCase().includes(filtroBusqueda);
    // Filtrar por año seleccionado
    const coincideAnio = (filtroAnio === 'todos') || (m.anio === filtroAnio);
    
    return coincideTexto && coincideAnio;
  });
  
  // 3. Si no hay resultados tras el filtro, mostrar un mensaje amigable
  if (materias.length === 0) {
    contenedor.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #888888; padding: 2rem; font-style: italic;">
        No se encontraron asignaturas que coincidan con los filtros aplicados.
      </div>
    `;
    return;
  }
  
  // 4. Renderizar las materias filtradas
  materias.sort((a, b) => a.anio.localeCompare(b.anio)).forEach(m => {
    const ficha = document.createElement('div');
    ficha.className = 'materia-card animate-card';
    
    const coloresAnio = {
      "1": "#2c3e50",
      "2": "#16a085",
      "3": "#2980b9",
      "4": "#8e44ad",
      "5": "#d35400"
    };
    
    ficha.style.backgroundColor = coloresAnio[m.anio] || "#34495e";
    const bloques = Math.floor(m.horas / 2);
    
    ficha.innerHTML = `
      <div class="materia-card-content">
        <h3>${m.nombre}</h3>
        <div class="info-tag"><strong>Año:</strong> ${m.anio}° Año</div>
        <div class="info-tag"><strong>Carga Horaria:</strong> ${m.horas} horas semanales</div>
        <span class="badge-bloques">${bloques} Bloques de 90 min</span>
      </div>
      <div class="materia-card-actions">
        <button class="btn-editar-ficha" onclick="cargarMateriaEnFormulario('${m.id}')">
          Editar
        </button>
        <button class="btn-eliminar-ficha" onclick="borrarMateriaRegistro('${m.id}')">
          Eliminar
        </button>
      </div>
    `;
    contenedor.appendChild(ficha);
  });
}

// NUEVA FUNCIÓN: Borra la materia basada en su ID desde la ficha
function borrarMateriaRegistro(id) {
  // Opcional: dejamos un confirm nativo solo para seguridad antes de borrar
  if (confirm("¿Estás seguro de que deseas eliminar esta asignatura?")) {
    DB.eliminarMateria(id);
    actualizarVistaMaterias();
    actualizarSelectMaterias();
    
    // Alerta de eliminación moderna
    mostrarNotificacion("Asignatura eliminada del registro.", "warning");
  }
}

function actualizarSelectMaterias() {
    const select = document.getElementById('prof-materia');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar Asignatura</option>';
    const materias = DB.obtenerMaterias();
    
    materias.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id; opt.textContent = `${m.nombre} (${m.anio}° Año)`;
        select.appendChild(opt);
    });
}
// --- CONTROLADOR DE FORMULARIO Y VISTA: PROFESORES ---
document.getElementById('form-profesor').addEventListener('submit', function(e) {
    e.preventDefault();
    const nombre = document.getElementById('prof-nombre').value.trim();
    const materiaId = document.getElementById('prof-materia').value;
    const anio = document.getElementById('prof-anio').value;
    const seccion = document.getElementById('prof-seccion').value;

    const materias = DB.obtenerMaterias();
    const mat = materias.find(m => m.id === materiaId);
    
    const profesores = DB.obtenerProfesores();
    const horasActuales = profesores.filter(p => p.nombre === nombre).reduce((sum, p) => sum + p.horasCarga, 0);
    
    if (horasActuales + mat.horas > 40) {
        alert(`El profesor ${nombre} excede las 40 horas semanales.`);
        return;
    }

    DB.guardarProfesor({
        id: Date.now().toString(),
        nombre,
        materia: mat.nombre,
        materiaId: mat.id,
        anio,
        seccion,
        horasCarga: mat.horas
    });

    this.reset();
    actualizarVistaProfesores();
});

function actualizarVistaProfesores() {
    const tbody = document.getElementById('tabla-profesores-body');
    tbody.innerHTML = '';
    const profesores = DB.obtenerProfesores();
    
    profesores.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.nombre}</td>
            <td>${p.materia}</td>
            <td>${p.anio}° "${p.seccion}"</td>
            <td>${p.horasCarga} horas</td>
            <td><button class="btn-delete-row" onclick="borrarProfesorRegistro('${p.id}')">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function borrarProfesorRegistro(id) {
    if (confirm("¿Deseas revocar la asignación de este profesor?")) {
        DB.eliminarProfesor(id);
        actualizarVistaProfesores();
    }
}

// --- CONTROLADOR DE LIMPIEZA TOTAL DE HORARIOS ---
function eliminarHorariosTotales() {
    if (confirm("¿Estás seguro de limpiar la cuadrícula completa de horarios institucionales? Deberás generarlos de nuevo.")) {
        DB.vaciarHorarios();
        actualizarTablaHorarioVisual();
    }
}

// --- MOTOR CON EQUILIBRIO DE CARGA DIARIA ---
function procesarMotorHorarios() {
    let nuevoHorarioGlobal = {};
    const profesores = DB.obtenerProfesores();
    
    let poolCargaProfesores = profesores.map(p => ({ 
        ...p, 
        bloquesRestantes: Math.floor(p.horasCarga / 2) 
    }));

    const mezclar = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Para cada curso, vamos a intentar asignar materias bloque por bloque
    // Pero intercalando los días para que todos crezcan parejos
    paresBloques.forEach(par => {
        // Mezclamos los días en cada bloque de horas para que no siempre
        // el Lunes tenga prioridad sobre el Viernes
        let diasMezclados = mezclar([...dias]);

        diasMezclados.forEach(dia => {
            let profesoresOcupadosAhora = [];
            let cursosMezclados = mezclar([...cursosEstructura]);

            cursosMezclados.forEach(curso => {
                curso.secciones.forEach(seccion => {
                    const cursoKey = `${curso.anio}-${seccion}`;
                    
                    if (!nuevoHorarioGlobal[cursoKey]) nuevoHorarioGlobal[cursoKey] = {};
                    if (!nuevoHorarioGlobal[cursoKey][dia]) nuevoHorarioGlobal[cursoKey][dia] = {};

                    // Verificamos si este curso ya vio esta materia hoy
                    let materiasHoy = Object.values(nuevoHorarioGlobal[cursoKey][dia]).map(v => v.materia);

                    let candidatos = mezclar([...poolCargaProfesores]);

                    const asignacionValida = candidatos.find(p => 
                        p.anio === curso.anio && 
                        p.seccion === seccion && 
                        p.bloquesRestantes > 0 &&
                        !profesoresOcupadosAhora.includes(p.nombre) &&
                        !materiasHoy.includes(p.materia)
                    );

                    if (asignacionValida) {
                        const indexOriginal = poolCargaProfesores.findIndex(prof => prof.id === asignacionValida.id);
                        poolCargaProfesores[indexOriginal].bloquesRestantes--;

                        profesoresOcupadosAhora.push(asignacionValida.nombre);

                        nuevoHorarioGlobal[cursoKey][dia][par.h1] = {
                            materia: asignacionValida.materia,
                            profesor: asignacionValida.nombre
                        };
                        nuevoHorarioGlobal[cursoKey][dia][par.h2] = {
                            materia: asignacionValida.materia,
                            profesor: asignacionValida.nombre
                        };
                    }
                });
            });
        });
    });

    DB.guardarHorarioGlobal(nuevoHorarioGlobal);
    alert("¡Horario Equilibrado Generado!");
    actualizarTablaHorarioVisual();
}

// --- RENDERIZADO DE LA MATRIZ DE CRONOGRAMA ---
function actualizarTablaHorarioVisual() {
    const anio = document.getElementById('filtro-anio').value;
    const seccion = document.getElementById('filtro-seccion').value;
    const cursoKey = `${anio}-${seccion}`;
    
    const tbody = document.getElementById('matriz-horario-body');
    tbody.innerHTML = '';

    const horarioMatrizGlobal = DB.obtenerHorarioGlobal();

    cronogramaHoras.forEach(bloque => {
        const tr = document.createElement('tr');
        
        if (bloque.receso) {
            tr.innerHTML = `<td class="receso-row">${bloque.label}</td><td colspan="5" class="receso-row">RECESO ESCOLAR (10 MIN)</td>`;
        } else {
            const tdHora = document.createElement('td');
            tdHora.textContent = bloque.label;
            tr.appendChild(tdHora);

            dias.forEach(dia => {
                const tdDia = document.createElement('td');
                
                if (horarioMatrizGlobal[cursoKey] && horarioMatrizGlobal[cursoKey][dia] && horarioMatrizGlobal[cursoKey][dia][bloque.id]) {
                    const dataCelda = horarioMatrizGlobal[cursoKey][dia][bloque.id];
                    tdDia.innerHTML = `<div class="cell-materia">${dataCelda.materia}</div><span class="cell-profesor">${dataCelda.profesor}</span>`;
                } else {
                    tdDia.innerHTML = `<span style="color:#bdc3c7; font-size:0.75rem;">Vacío</span>`;
                }
                tr.appendChild(tdDia);
            });
        }
        tbody.appendChild(tr);
    });

}

// ESCUCHADORES PARA FILTRADO EN TIEMPO REAL
document.getElementById('buscar-materia')?.addEventListener('input', actualizarVistaMaterias);
document.getElementById('filtrar-anio')?.addEventListener('change', actualizarVistaMaterias);

function exportarPDF() {
    const anio = document.getElementById('filtro-anio').value;
    const seccion = document.getElementById('filtro-seccion').value;
    const elemento = document.querySelector('.schedule-container');

    // Creamos un clon para no alterar la vista del usuario
    const clon = elemento.cloneNode(true);
    
    // ESTILOS CRÍTICOS DE AJUSTE
    clon.style.width = "1050px"; // Ancho óptimo para A4 Horizontal
    clon.style.fontSize = "10px"; // Reducción de fuente base
    clon.style.backgroundColor = "white";
    
    const opciones = {
        margin: [5, 5, 5, 5], // Márgenes mínimos
        filename: `Horario_${anio}_${seccion}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            letterRendering: true,
            useCORS: true 
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'landscape',
            compress: true 
        }
    };

    // Forzamos que todas las filas tengan un alto máximo pequeño
    const filas = clon.querySelectorAll('tr');
    filas.forEach(fila => {
        fila.style.height = "auto";
    });

    const celdas = clon.querySelectorAll('td, th');
    celdas.forEach(celda => {
        celda.style.padding = "2px"; // Espaciado mínimo
        celda.style.lineHeight = "1";
    });

    html2pdf().set(opciones).from(clon).save();
}